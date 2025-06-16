const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const APIKeyValidator = require('../utils/apiKeyValidator');
const router = express.Router();

// POST /api/setup/validate-keys - Validate API keys
router.post('/validate-keys', async (req, res) => {
  try {
    const { keys } = req.body;
    
    if (!keys || typeof keys !== 'object') {
      return res.status(400).json({ error: 'Keys object is required' });
    }

    const validationResults = await APIKeyValidator.validateAllKeys(keys);
    
    res.json({
      success: true,
      results: validationResults,
      summary: {
        totalKeys: Object.keys(validationResults).length,
        validKeys: Object.values(validationResults).filter(r => r.valid).length,
        invalidKeys: Object.values(validationResults).filter(r => !r.valid).length
      }
    });

  } catch (error) {
    console.error('Error validating API keys:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/setup/configure - Configure API keys and update .env
router.post('/configure', async (req, res) => {
  try {
    const { keys, validateFirst = true } = req.body;
    
    if (!keys || typeof keys !== 'object') {
      return res.status(400).json({ error: 'Keys object is required' });
    }

    let validationResults = {};
    
    // Validate keys first if requested
    if (validateFirst) {
      console.log('🔍 Validating API keys before configuration...');
      validationResults = await APIKeyValidator.validateAllKeys(keys);
      
      const invalidKeys = Object.entries(validationResults)
        .filter(([_, result]) => !result.valid)
        .map(([key, result]) => ({ key, error: result.error }));
      
      if (invalidKeys.length > 0) {
        return res.status(400).json({
          error: 'Some API keys are invalid',
          invalidKeys,
          validationResults
        });
      }
    }

    // Generate .env content
    const envContent = APIKeyValidator.generateEnvContent(keys);
    const envPath = path.join(__dirname, '../.env');
    
    // Backup existing .env if it exists
    try {
      const existingEnv = await fs.readFile(envPath, 'utf8');
      const backupPath = path.join(__dirname, `../.env.backup.${Date.now()}`);
      await fs.writeFile(backupPath, existingEnv);
      console.log(`📁 Backed up existing .env to ${path.basename(backupPath)}`);
    } catch (error) {
      // .env doesn't exist, that's fine
    }

    // Write new .env file
    await fs.writeFile(envPath, envContent);
    console.log('✅ Successfully updated .env file');

    // Update process.env for immediate effect
    const envLines = envContent.split('\n');
    for (const line of envLines) {
      if (line.includes('=') && !line.startsWith('#')) {
        const [key, value] = line.split('=');
        if (key && value) {
          process.env[key.trim()] = value.trim();
        }
      }
    }

    res.json({
      success: true,
      message: 'API keys configured successfully',
      validationResults,
      configuredKeys: Object.keys(keys),
      nextSteps: [
        'Restart the server for changes to take full effect',
        'Test the APIs using the health endpoint',
        'Visit the frontend to see live data'
      ]
    });

  } catch (error) {
    console.error('Error configuring API keys:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/setup/status - Get current API configuration status
router.get('/status', async (req, res) => {
  try {
    const status = {
      newsapi: {
        configured: !!process.env.NEWS_API_KEY,
        keyLength: process.env.NEWS_API_KEY ? process.env.NEWS_API_KEY.length : 0
      },
      alphavantage: {
        configured: !!process.env.ALPHA_VANTAGE_API_KEY,
        keyLength: process.env.ALPHA_VANTAGE_API_KEY ? process.env.ALPHA_VANTAGE_API_KEY.length : 0
      },
      finnhub: {
        configured: !!process.env.FINNHUB_API_KEY,
        keyLength: process.env.FINNHUB_API_KEY ? process.env.FINNHUB_API_KEY.length : 0
      },
      polygon: {
        configured: !!process.env.POLYGON_API_KEY,
        keyLength: process.env.POLYGON_API_KEY ? process.env.POLYGON_API_KEY.length : 0
      }
    };

    const totalConfigured = Object.values(status).filter(s => s.configured).length;
    
    res.json({
      status,
      summary: {
        totalConfigured,
        readyForTesting: totalConfigured > 0,
        recommendations: generateRecommendations(status)
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/setup/test-integration - Test live integration
router.post('/test-integration', async (req, res) => {
  try {
    const { symbol = 'AAPL' } = req.body;
    
    console.log(`🧪 Testing integration with symbol: ${symbol}`);
    
    // Import services dynamically to get fresh instances with new keys
    const DataAggregatorService = require('../services/dataAggregator');
    const dataAggregator = new DataAggregatorService();
    
    const testResults = {};
    
    // Test stock data
    console.log('📊 Testing stock data retrieval...');
    try {
      const stockData = await dataAggregator.getStockData(symbol);
      testResults.stockData = {
        success: !!stockData,
        data: stockData ? {
          symbol: stockData.symbol,
          price: stockData.price,
          source: stockData.source
        } : null
      };
    } catch (error) {
      testResults.stockData = { success: false, error: error.message };
    }
    
    // Test news data
    console.log('📰 Testing news data retrieval...');
    try {
      const newsData = await dataAggregator.getStockNews(symbol, { limit: 5 });
      testResults.newsData = {
        success: newsData.length > 0,
        count: newsData.length,
        sources: [...new Set(newsData.map(n => n.source || n.apiSource))]
      };
    } catch (error) {
      testResults.newsData = { success: false, error: error.message };
    }
    
    // Test market overview
    console.log('🌍 Testing market overview...');
    try {
      const marketOverview = await dataAggregator.getMarketOverview();
      testResults.marketOverview = {
        success: !!marketOverview,
        indices: Object.keys(marketOverview.marketIndices || {}),
        newsCount: marketOverview.topNews?.length || 0
      };
    } catch (error) {
      testResults.marketOverview = { success: false, error: error.message };
    }
    
    // Test API health
    console.log('🔍 Testing API health...');
    try {
      const healthStatus = await dataAggregator.checkAllServicesHealth();
      testResults.apiHealth = {
        success: true,
        services: healthStatus.services.map(s => ({
          name: s.service,
          status: s.status,
          healthy: s.status === 'healthy'
        }))
      };
    } catch (error) {
      testResults.apiHealth = { success: false, error: error.message };
    }
    
    const overallSuccess = Object.values(testResults).some(test => test.success);
    
    res.json({
      success: overallSuccess,
      symbol,
      testResults,
      summary: generateTestSummary(testResults),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error testing integration:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper functions
function generateRecommendations(status) {
  const recommendations = [];
  
  if (!status.newsapi.configured) {
    recommendations.push('Get NewsAPI key for real-time news (https://newsapi.org)');
  }
  
  if (!status.alphavantage.configured) {
    recommendations.push('Get Alpha Vantage key for enhanced data (https://www.alphavantage.co)');
  }
  
  if (status.newsapi.configured && status.alphavantage.configured) {
    recommendations.push('All essential APIs configured! Test the integration.');
  }
  
  if (!status.finnhub.configured) {
    recommendations.push('Optional: Get Finnhub key for additional data sources');
  }
  
  return recommendations;
}

function generateTestSummary(testResults) {
  const totalTests = Object.keys(testResults).length;
  const passedTests = Object.values(testResults).filter(test => test.success).length;
  
  return {
    totalTests,
    passedTests,
    passRate: totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0,
    status: passedTests === totalTests ? 'all_passed' : 
            passedTests > 0 ? 'partial_success' : 'all_failed'
  };
}

module.exports = router;
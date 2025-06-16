const axios = require('axios');

class APIKeyValidator {
  static async validateNewsAPI(apiKey) {
    if (!apiKey) return { valid: false, error: 'API key not provided' };
    
    try {
      const response = await axios.get('https://newsapi.org/v2/everything', {
        params: {
          q: 'test',
          pageSize: 1,
          apiKey: apiKey
        },
        timeout: 10000
      });
      
      if (response.data.status === 'ok') {
        return { 
          valid: true, 
          message: 'NewsAPI key is valid',
          requestsRemaining: response.headers['x-api-key-requests-remaining-today'],
          requestsLimit: response.headers['x-api-key-requests-limit-today']
        };
      } else {
        return { valid: false, error: response.data.message || 'Invalid response' };
      }
    } catch (error) {
      if (error.response?.status === 401) {
        return { valid: false, error: 'Invalid API key' };
      } else if (error.response?.status === 429) {
        return { valid: false, error: 'Rate limit exceeded' };
      } else {
        return { valid: false, error: error.message };
      }
    }
  }

  static async validateAlphaVantage(apiKey) {
    if (!apiKey) return { valid: false, error: 'API key not provided' };
    
    try {
      const response = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: 'AAPL',
          apikey: apiKey
        },
        timeout: 15000
      });
      
      if (response.data['Global Quote']) {
        return { 
          valid: true, 
          message: 'Alpha Vantage key is valid',
          data: response.data['Global Quote']
        };
      } else if (response.data.Note) {
        return { valid: false, error: 'Rate limit exceeded or invalid key' };
      } else if (response.data.Information) {
        return { valid: false, error: response.data.Information };
      } else {
        return { valid: false, error: 'Invalid response format' };
      }
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  static async validateFinnhub(apiKey) {
    if (!apiKey) return { valid: false, error: 'API key not provided' };
    
    try {
      const response = await axios.get('https://finnhub.io/api/v1/quote', {
        params: {
          symbol: 'AAPL',
          token: apiKey
        },
        timeout: 10000
      });
      
      if (response.data.c !== undefined) { // 'c' is current price
        return { 
          valid: true, 
          message: 'Finnhub key is valid',
          data: response.data
        };
      } else {
        return { valid: false, error: 'Invalid response or unauthorized' };
      }
    } catch (error) {
      if (error.response?.status === 401) {
        return { valid: false, error: 'Invalid API key' };
      } else if (error.response?.status === 429) {
        return { valid: false, error: 'Rate limit exceeded' };
      } else {
        return { valid: false, error: error.message };
      }
    }
  }

  static async validatePolygon(apiKey) {
    if (!apiKey) return { valid: false, error: 'API key not provided' };
    
    try {
      const response = await axios.get('https://api.polygon.io/v2/aggs/ticker/AAPL/prev', {
        params: {
          adjusted: true,
          apikey: apiKey
        },
        timeout: 10000
      });
      
      if (response.data.status === 'OK' && response.data.results) {
        return { 
          valid: true, 
          message: 'Polygon.io key is valid',
          data: response.data.results[0]
        };
      } else {
        return { valid: false, error: response.data.error || 'Invalid response' };
      }
    } catch (error) {
      if (error.response?.status === 401) {
        return { valid: false, error: 'Invalid API key' };
      } else if (error.response?.status === 403) {
        return { valid: false, error: 'Access forbidden - check subscription' };
      } else if (error.response?.status === 429) {
        return { valid: false, error: 'Rate limit exceeded' };
      } else {
        return { valid: false, error: error.message };
      }
    }
  }

  static async validateAllKeys(keys) {
    const results = {};
    
    console.log('🔍 Validating API keys...');
    
    // Validate NewsAPI
    if (keys.newsapi) {
      console.log('📰 Testing NewsAPI...');
      results.newsapi = await this.validateNewsAPI(keys.newsapi);
      console.log(`📰 NewsAPI: ${results.newsapi.valid ? '✅' : '❌'} ${results.newsapi.message || results.newsapi.error}`);
    }
    
    // Validate Alpha Vantage
    if (keys.alphavantage) {
      console.log('📊 Testing Alpha Vantage...');
      results.alphavantage = await this.validateAlphaVantage(keys.alphavantage);
      console.log(`📊 Alpha Vantage: ${results.alphavantage.valid ? '✅' : '❌'} ${results.alphavantage.message || results.alphavantage.error}`);
    }
    
    // Validate Finnhub
    if (keys.finnhub) {
      console.log('🔍 Testing Finnhub...');
      results.finnhub = await this.validateFinnhub(keys.finnhub);
      console.log(`🔍 Finnhub: ${results.finnhub.valid ? '✅' : '❌'} ${results.finnhub.message || results.finnhub.error}`);
    }
    
    // Validate Polygon
    if (keys.polygon) {
      console.log('🔺 Testing Polygon.io...');
      results.polygon = await this.validatePolygon(keys.polygon);
      console.log(`🔺 Polygon.io: ${results.polygon.valid ? '✅' : '❌'} ${results.polygon.message || results.polygon.error}`);
    }
    
    // Summary
    const validKeys = Object.values(results).filter(r => r.valid).length;
    const totalKeys = Object.keys(results).length;
    console.log(`\n🎯 Validation Summary: ${validKeys}/${totalKeys} API keys valid`);
    
    return results;
  }

  static generateEnvContent(keys) {
    let envContent = `# Stock News Aggregator API Keys
# Generated: ${new Date().toISOString()}

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=stock_news_db
DB_USER=postgres
DB_PASSWORD=password

# Server Configuration
NODE_ENV=development
PORT=3001

# JWT Configuration
JWT_SECRET=development_jwt_secret_key_change_in_production
JWT_EXPIRES_IN=24h

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Cache Configuration
CACHE_TTL=3600

`;

    if (keys.newsapi) {
      envContent += `# NewsAPI Configuration
NEWS_API_KEY=${keys.newsapi}

`;
    }

    if (keys.alphavantage) {
      envContent += `# Alpha Vantage Configuration
ALPHA_VANTAGE_API_KEY=${keys.alphavantage}

`;
    }

    if (keys.finnhub) {
      envContent += `# Finnhub Configuration
FINNHUB_API_KEY=${keys.finnhub}

`;
    }

    if (keys.polygon) {
      envContent += `# Polygon.io Configuration
POLYGON_API_KEY=${keys.polygon}

`;
    }

    envContent += `# SEC EDGAR API (no key required)
SEC_EDGAR_USER_AGENT=StockNewsAggregator contact@example.com

# Additional API Configuration (optional)
# IEX_CLOUD_API_KEY=your_iex_cloud_key_here
# QUANDL_API_KEY=your_quandl_key_here
`;

    return envContent;
  }
}

module.exports = APIKeyValidator;
const express = require('express');
const DataAggregatorService = require('../services/dataAggregator');
const router = express.Router();

const dataAggregator = new DataAggregatorService();

// GET /api/market/overview - Get market overview
router.get('/overview', async (req, res) => {
  try {
    const overview = await dataAggregator.getMarketOverview();
    res.json(overview);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/market/trending - Get trending stocks
router.get('/trending', async (req, res) => {
  try {
    // For now, return popular stocks - in future, implement trending algorithm
    const trendingSymbols = ['AAPL', 'TSLA', 'NVDA', 'GOOGL', 'MSFT', 'META', 'AMZN'];
    
    const trendingStocks = await Promise.all(
      trendingSymbols.map(async (symbol) => {
        try {
          const stockData = await dataAggregator.getStockData(symbol);
          if (stockData) {
            const newsCount = await dataAggregator.getStockNews(symbol, {
              from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            });
            
            return {
              symbol: stockData.symbol,
              name: stockData.shortName || stockData.longName,
              price: stockData.price,
              change: stockData.change,
              changePercent: stockData.changePercent,
              volume: stockData.volume,
              newsCount: newsCount.length,
              sector: stockData.sector
            };
          }
          return null;
        } catch (error) {
          console.warn(`Failed to get data for ${symbol}:`, error.message);
          return null;
        }
      })
    );

    const validStocks = trendingStocks.filter(stock => stock !== null);

    res.json({
      trending: validStocks,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/market/sectors - Get sector performance
router.get('/sectors', async (req, res) => {
  try {
    const overview = await dataAggregator.getMarketOverview();
    res.json({
      sectors: overview.sectorPerformance,
      lastUpdated: overview.lastUpdated
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/market/health - Check API health
router.get('/health', async (req, res) => {
  try {
    const healthStatus = await dataAggregator.checkAllServicesHealth();
    
    const overallStatus = healthStatus.services.every(service => 
      service.status === 'healthy'
    ) ? 'healthy' : 'degraded';

    res.json({
      status: overallStatus,
      ...healthStatus
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
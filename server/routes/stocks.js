const express = require('express');
const DataAggregatorService = require('../services/dataAggregator');
const router = express.Router();

const dataAggregator = new DataAggregatorService();

// GET /api/stocks - Search stocks
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    
    if (!search) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const stocks = await dataAggregator.searchStocks(search);
    res.json({ 
      stocks,
      query: search,
      count: stocks.length 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/stocks/:symbol - Get stock details
router.get('/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    const [stockData, companyProfile] = await Promise.all([
      dataAggregator.getStockData(symbol),
      dataAggregator.getCompanyProfile(symbol)
    ]);

    if (!stockData) {
      return res.status(404).json({ error: 'Stock not found' });
    }

    res.json({
      ...stockData,
      profile: companyProfile,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/stocks/:symbol/price-history - Get stock price history
router.get('/:symbol/price-history', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { timeframe = '1mo', interval = '1d' } = req.query;
    
    const historicalData = await dataAggregator.getHistoricalData(symbol, timeframe, interval);
    
    if (!historicalData) {
      return res.status(404).json({ error: 'Historical data not found' });
    }

    res.json(historicalData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/stocks/:symbol/watchlist - Add to watchlist
router.post('/:symbol/watchlist', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { userId } = req.body;
    // TODO: Implement watchlist addition
    res.json({ 
      message: `Added ${symbol.toUpperCase()} to watchlist`,
      success: true 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/stocks/:symbol/watchlist - Remove from watchlist
router.delete('/:symbol/watchlist', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { userId } = req.body;
    // TODO: Implement watchlist removal
    res.json({ 
      message: `Removed ${symbol.toUpperCase()} from watchlist`,
      success: true 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
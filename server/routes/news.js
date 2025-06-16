const express = require('express');
const DataAggregatorService = require('../services/dataAggregator');
const NewsClassificationService = require('../services/newsClassification');
const MarketCorrelationService = require('../services/marketCorrelation');
const router = express.Router();

const dataAggregator = new DataAggregatorService();
const newsClassifier = new NewsClassificationService();
const marketCorrelator = new MarketCorrelationService();

// GET /api/news/:symbol - Get news for a specific stock
router.get('/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { 
      limit = 50, 
      offset = 0, 
      classification = 'all',
      dateFrom,
      dateTo 
    } = req.query;
    
    const options = {};
    if (dateFrom) options.from = dateFrom;
    if (dateTo) options.to = dateTo;
    
    const allNews = await dataAggregator.getStockNews(symbol, options);
    
    // Filter by classification if specified
    let filteredNews = allNews;
    if (classification !== 'all') {
      filteredNews = allNews.filter(article => 
        article.classification?.type?.category === classification
      );
    }
    
    // Apply pagination
    const startIndex = parseInt(offset);
    const endIndex = startIndex + parseInt(limit);
    const paginatedNews = filteredNews.slice(startIndex, endIndex);
    
    res.json({
      symbol: symbol.toUpperCase(),
      news: paginatedNews,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: filteredNews.length,
        hasMore: endIndex < filteredNews.length
      },
      filters: {
        classification,
        dateFrom,
        dateTo
      },
      summary: {
        total: allNews.length,
        stockSpecific: allNews.filter(n => n.classification?.type?.category === 'stock-specific').length,
        competitor: allNews.filter(n => n.classification?.type?.category === 'competitor').length,
        industry: allNews.filter(n => n.classification?.type?.category === 'industry').length,
        macro: allNews.filter(n => n.classification?.type?.category === 'macro').length
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/news/:symbol/today - Get today's news for a stock
router.get('/:symbol/today', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const newsData = await dataAggregator.getStockNews(symbol, {
      from: yesterday,
      to: today
    });

    // Filter for today's news only
    const todaysNews = newsData.filter(article => {
      const articleDate = new Date(article.publishedAt).toISOString().split('T')[0];
      return articleDate === today;
    });

    const summary = {
      total: todaysNews.length,
      stockSpecific: todaysNews.filter(article => 
        article.classification?.type?.category === 'stock-specific'
      ).length,
      competitor: todaysNews.filter(article => 
        article.classification?.type?.category === 'competitor'
      ).length,
      industry: todaysNews.filter(article => 
        article.classification?.type?.category === 'industry'
      ).length,
      macro: todaysNews.filter(article => 
        article.classification?.type?.category === 'macro'
      ).length
    };

    res.json({
      symbol: symbol.toUpperCase(),
      date: today,
      news: todaysNews.slice(0, 20), // Limit to 20 most relevant
      summary
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/news/:symbol/competitor-impact - Get competitor impact news
router.get('/:symbol/competitor-impact', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { days = 7 } = req.query;
    
    // TODO: Implement competitor impact analysis
    res.json({
      symbol: symbol.toUpperCase(),
      timeframe: `${days} days`,
      competitorNews: [],
      impactAnalysis: {
        totalEvents: 0,
        positiveImpact: 0,
        negativeImpact: 0,
        neutralImpact: 0
      },
      message: 'Competitor impact endpoint'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/news/classify - Classify news article
router.post('/classify', async (req, res) => {
  try {
    const { title, content, url, stockSymbol, sector } = req.body;
    
    if (!title || !stockSymbol) {
      return res.status(400).json({ error: 'Title and stockSymbol are required' });
    }

    const article = { title, content, url };
    const classification = await newsClassifier.classifyNews(article, stockSymbol, sector || 'Technology');
    
    res.json({
      classification: classification.type.category,
      subcategory: classification.type.subcategory,
      relevanceScore: classification.relevance,
      sentimentScore: classification.sentiment,
      urgency: classification.urgency,
      priceImpact: classification.priceImpact,
      confidence: classification.confidence,
      reasoning: classification.type.reason
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/news/:symbol/daily-summary - Get comprehensive daily analysis
router.get('/:symbol/daily-summary', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    // Get real stock data and news
    const [stockData, newsData] = await Promise.all([
      dataAggregator.getStockData(symbol),
      dataAggregator.getStockNews(symbol, {
        from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      })
    ]);

    if (!stockData) {
      return res.status(404).json({ error: 'Stock not found' });
    }

    // Generate news-based summary
    const newsSummary = await newsClassifier.generateDailySummary(symbol, stockData, newsData);

    // Analyze market correlation
    const marketAnalysis = await marketCorrelator.analyzeStockMovement(symbol, stockData, newsData);

    // Combine insights
    const comprehensiveSummary = {
      symbol: symbol.toUpperCase(),
      date: new Date().toISOString().split('T')[0],
      priceMovement: {
        currentPrice: stockData.price,
        change: stockData.changePercent,
        direction: stockData.changePercent > 0 ? 'up' : stockData.changePercent < 0 ? 'down' : 'flat',
        significance: newsSummary.priceMovement.significance
      },
      movementAnalysis: {
        primaryDriver: marketAnalysis.explanation,
        confidence: marketAnalysis.confidence,
        contributingFactors: marketAnalysis.factors
      },
      newsBreakdown: {
        totalRelevant: newsData.filter(n => n.relevanceScore > 0.2).length,
        stockSpecific: newsData.filter(n => n.classification?.type?.category === 'stock-specific').length,
        competitor: newsData.filter(n => n.classification?.type?.category === 'competitor').length,
        industry: newsData.filter(n => n.classification?.type?.category === 'industry').length,
        macro: newsData.filter(n => n.classification?.type?.category === 'macro').length
      },
      keyInsights: {
        explanation: newsSummary.movementExplanation,
        sentiment: newsSummary.sentiment > 0.2 ? 'positive' : newsSummary.sentiment < -0.2 ? 'negative' : 'neutral',
        keyEvents: newsSummary.keyEvents,
        marketCorrelation: marketAnalysis.correlations.market,
        volumeAnalysis: marketAnalysis.correlations.volume
      },
      topNews: newsData
        .filter(n => n.relevanceScore > 0.3)
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 5)
        .map(article => ({
          title: article.title,
          source: article.source,
          classification: article.classification?.type?.category || 'unrelated',
          relevance: article.relevanceScore,
          sentiment: article.sentimentScore,
          impact: article.classification?.priceImpact || 'unknown'
        }))
    };

    res.json(comprehensiveSummary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
const express = require('express');
const DataAggregatorService = require('../services/dataAggregator');
const NewsClassificationService = require('../services/newsClassification');
const MarketCorrelationService = require('../services/marketCorrelation');
const router = express.Router();

const dataAggregator = new DataAggregatorService();
const newsClassifier = new NewsClassificationService();
const marketCorrelator = new MarketCorrelationService();

// GET /api/watchlist/daily-digest - Get comprehensive daily digest for watchlist
router.get('/daily-digest', async (req, res) => {
  try {
    const { 
      symbols = 'AAPL,TSLA,GOOGL,MSFT,NVDA', // Default watchlist for demo
      date = new Date().toISOString().split('T')[0]
    } = req.query;
    
    const watchlistSymbols = symbols.split(',').map(s => s.trim().toUpperCase());
    
    if (watchlistSymbols.length === 0) {
      return res.status(400).json({ error: 'No symbols provided' });
    }

    console.log(`Generating daily digest for ${watchlistSymbols.length} stocks:`, watchlistSymbols.join(', '));

    // Get data for all stocks in parallel
    const stockDataPromises = watchlistSymbols.map(async (symbol) => {
      try {
        const [stockData, newsData] = await Promise.all([
          dataAggregator.getStockData(symbol),
          dataAggregator.getStockNews(symbol, {
            from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            to: date
          })
        ]);

        if (!stockData) {
          console.warn(`No stock data found for ${symbol}`);
          return null;
        }

        // Generate movement analysis
        const movementAnalysis = await marketCorrelator.analyzeStockMovement(symbol, stockData, newsData);
        
        // Filter today's news
        const todaysNews = newsData.filter(article => {
          const articleDate = new Date(article.publishedAt).toISOString().split('T')[0];
          return articleDate === date;
        });

        // Categorize news
        const stockSpecificNews = todaysNews.filter(n => n.classification?.type?.category === 'stock-specific');
        const competitorNews = todaysNews.filter(n => n.classification?.type?.category === 'competitor');
        const industryNews = todaysNews.filter(n => n.classification?.type?.category === 'industry');
        const macroNews = todaysNews.filter(n => n.classification?.type?.category === 'macro');

        // Calculate priority score
        const priorityScore = calculatePriorityScore(stockData, todaysNews, movementAnalysis);

        return {
          symbol,
          stockData: {
            name: stockData.shortName || stockData.longName || symbol,
            price: stockData.price,
            change: stockData.change,
            changePercent: stockData.changePercent,
            volume: stockData.volume,
            sector: stockData.sector
          },
          movementAnalysis: {
            explanation: movementAnalysis.explanation,
            confidence: movementAnalysis.confidence,
            primaryDriver: movementAnalysis.explanation
          },
          newsBreakdown: {
            total: todaysNews.length,
            stockSpecific: stockSpecificNews.length,
            competitor: competitorNews.length,
            industry: industryNews.length,
            macro: macroNews.length
          },
          topNews: todaysNews
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .slice(0, 5)
            .map(article => ({
              title: article.title,
              source: article.source,
              classification: article.classification?.type?.category || 'unrelated',
              relevance: article.relevanceScore,
              sentiment: article.sentimentScore,
              impact: article.classification?.priceImpact || 'unknown',
              publishedAt: article.publishedAt,
              url: article.url
            })),
          priorityScore,
          alerts: generateAlerts(stockData, todaysNews, movementAnalysis)
        };
      } catch (error) {
        console.error(`Error processing ${symbol}:`, error.message);
        return {
          symbol,
          error: error.message,
          priorityScore: 0
        };
      }
    });

    const stockResults = await Promise.all(stockDataPromises);
    const validStocks = stockResults.filter(stock => stock && !stock.error);
    const errorStocks = stockResults.filter(stock => stock && stock.error);

    // Sort by priority score (highest first)
    validStocks.sort((a, b) => b.priorityScore - a.priorityScore);

    // Generate market context
    const marketOverview = await dataAggregator.getMarketOverview();
    
    // Aggregate all news for overall insights
    const allNews = validStocks.flatMap(stock => stock.topNews || []);
    const overallInsights = generateOverallInsights(validStocks, marketOverview);

    const digest = {
      date,
      watchlistSymbols,
      summary: {
        totalStocks: validStocks.length,
        stocksWithNews: validStocks.filter(s => s.newsBreakdown?.total > 0).length,
        highPriorityAlerts: validStocks.filter(s => s.priorityScore > 7).length,
        totalNewsArticles: allNews.length,
        averagePriorityScore: validStocks.reduce((sum, s) => sum + s.priorityScore, 0) / validStocks.length
      },
      marketContext: {
        indices: marketOverview.marketIndices,
        overallDirection: calculateMarketDirection(marketOverview.marketIndices),
        topMarketNews: marketOverview.topNews?.slice(0, 3) || []
      },
      insights: overallInsights,
      stocks: validStocks,
      errors: errorStocks,
      generatedAt: new Date().toISOString()
    };

    res.json(digest);

  } catch (error) {
    console.error('Error generating daily digest:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/watchlist/alerts - Get high-priority alerts for watchlist
router.get('/alerts', async (req, res) => {
  try {
    const { 
      symbols = 'AAPL,TSLA,GOOGL,MSFT,NVDA',
      minPriority = 6
    } = req.query;
    
    const watchlistSymbols = symbols.split(',').map(s => s.trim().toUpperCase());
    
    const alertsPromises = watchlistSymbols.map(async (symbol) => {
      try {
        const [stockData, newsData] = await Promise.all([
          dataAggregator.getStockData(symbol),
          dataAggregator.getStockNews(symbol, {
            from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          })
        ]);

        if (!stockData) return null;

        const movementAnalysis = await marketCorrelator.analyzeStockMovement(symbol, stockData, newsData);
        const priorityScore = calculatePriorityScore(stockData, newsData, movementAnalysis);
        
        if (priorityScore >= minPriority) {
          const alerts = generateAlerts(stockData, newsData, movementAnalysis);
          
          return {
            symbol,
            priorityScore,
            alerts,
            stockData: {
              name: stockData.shortName || stockData.longName || symbol,
              price: stockData.price,
              changePercent: stockData.changePercent
            }
          };
        }
        
        return null;
      } catch (error) {
        console.error(`Error getting alerts for ${symbol}:`, error.message);
        return null;
      }
    });

    const results = await Promise.all(alertsPromises);
    const alerts = results.filter(result => result !== null);

    res.json({
      alerts: alerts.sort((a, b) => b.priorityScore - a.priorityScore),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper functions
function calculatePriorityScore(stockData, newsData, movementAnalysis) {
  let score = 0;
  
  // Price movement significance
  const absChangePercent = Math.abs(stockData.changePercent || 0);
  if (absChangePercent > 5) score += 4;
  else if (absChangePercent > 3) score += 3;
  else if (absChangePercent > 2) score += 2;
  else if (absChangePercent > 1) score += 1;
  
  // News volume and quality
  const highRelevanceNews = newsData.filter(n => n.relevanceScore > 0.7).length;
  const stockSpecificNews = newsData.filter(n => n.classification?.type?.category === 'stock-specific').length;
  
  score += Math.min(highRelevanceNews * 2, 6); // Up to 6 points for news
  score += Math.min(stockSpecificNews * 1.5, 4); // Up to 4 points for stock-specific news
  
  // Volume analysis
  if (movementAnalysis?.correlations?.volume?.significance === 'high') score += 2;
  else if (movementAnalysis?.correlations?.volume?.significance === 'medium') score += 1;
  
  // High-impact news
  const highImpactNews = newsData.filter(n => n.classification?.priceImpact === 'high').length;
  score += highImpactNews * 2;
  
  return Math.min(Math.round(score), 10); // Cap at 10
}

function generateAlerts(stockData, newsData, movementAnalysis) {
  const alerts = [];
  const symbol = stockData.symbol;
  const changePercent = stockData.changePercent || 0;
  
  // Price movement alerts
  if (Math.abs(changePercent) > 5) {
    alerts.push({
      type: 'price_movement',
      severity: 'high',
      message: `${symbol} ${changePercent > 0 ? 'surged' : 'dropped'} ${Math.abs(changePercent).toFixed(1)}%`,
      explanation: movementAnalysis?.explanation || 'Significant price movement detected'
    });
  } else if (Math.abs(changePercent) > 3) {
    alerts.push({
      type: 'price_movement',
      severity: 'medium',
      message: `${symbol} moved ${Math.abs(changePercent).toFixed(1)}%`,
      explanation: movementAnalysis?.explanation || 'Notable price movement'
    });
  }
  
  // News-based alerts
  const stockSpecificNews = newsData.filter(n => n.classification?.type?.category === 'stock-specific');
  const highImpactNews = newsData.filter(n => n.classification?.priceImpact === 'high');
  
  if (highImpactNews.length > 0) {
    alerts.push({
      type: 'high_impact_news',
      severity: 'high',
      message: `${highImpactNews.length} high-impact news article${highImpactNews.length > 1 ? 's' : ''} for ${symbol}`,
      explanation: `Major developments that could significantly affect stock price`
    });
  }
  
  if (stockSpecificNews.length > 2) {
    alerts.push({
      type: 'news_volume',
      severity: 'medium',
      message: `High news activity for ${symbol} (${stockSpecificNews.length} articles)`,
      explanation: 'Increased media attention may indicate important developments'
    });
  }
  
  // Volume alerts
  if (movementAnalysis?.correlations?.volume?.significance === 'high') {
    alerts.push({
      type: 'volume_spike',
      severity: 'medium',
      message: `Unusual trading volume for ${symbol}`,
      explanation: `Trading volume is ${movementAnalysis.correlations.volume.ratio?.toFixed(1)}x average`
    });
  }
  
  return alerts;
}

function generateOverallInsights(stocks, marketOverview) {
  const insights = [];
  
  // Market correlation insights
  const stocksMovingWithMarket = stocks.filter(s => 
    s.movementAnalysis?.explanation?.includes('market') || 
    s.movementAnalysis?.explanation?.includes('correlation')
  ).length;
  
  if (stocksMovingWithMarket > stocks.length * 0.6) {
    insights.push({
      type: 'market_correlation',
      message: `${stocksMovingWithMarket}/${stocks.length} stocks moving with broader market`,
      significance: 'high'
    });
  }
  
  // Sector concentration insights
  const sectorGroups = {};
  stocks.forEach(stock => {
    const sector = stock.stockData.sector || 'Unknown';
    if (!sectorGroups[sector]) sectorGroups[sector] = [];
    sectorGroups[sector].push(stock);
  });
  
  Object.entries(sectorGroups).forEach(([sector, sectorStocks]) => {
    if (sectorStocks.length > 1) {
      const avgChange = sectorStocks.reduce((sum, s) => sum + (s.stockData.changePercent || 0), 0) / sectorStocks.length;
      if (Math.abs(avgChange) > 2) {
        insights.push({
          type: 'sector_movement',
          message: `${sector} sector ${avgChange > 0 ? 'up' : 'down'} ${Math.abs(avgChange).toFixed(1)}% on average`,
          significance: Math.abs(avgChange) > 3 ? 'high' : 'medium'
        });
      }
    }
  });
  
  // High-priority stocks
  const highPriorityStocks = stocks.filter(s => s.priorityScore > 7);
  if (highPriorityStocks.length > 0) {
    insights.push({
      type: 'high_priority',
      message: `${highPriorityStocks.length} stocks require immediate attention`,
      significance: 'high',
      stocks: highPriorityStocks.map(s => s.symbol)
    });
  }
  
  return insights;
}

function calculateMarketDirection(indices) {
  const indexChanges = Object.values(indices || {}).map(index => index.changePercent || 0);
  if (indexChanges.length === 0) return 'neutral';
  
  const avgChange = indexChanges.reduce((sum, change) => sum + change, 0) / indexChanges.length;
  
  if (avgChange > 0.5) return 'bullish';
  if (avgChange < -0.5) return 'bearish';
  return 'neutral';
}

module.exports = router;
const NewsAPIService = require('./newsAPI');
const AlphaVantageAPIService = require('./alphaVantageAPI');
const YahooFinanceAPIService = require('./yahooFinanceAPI');
const TwelveDataAPIService = require('./twelveDataAPI');
const NewsClassificationService = require('./newsClassification');

class DataAggregatorService {
  constructor() {
    this.newsAPI = new NewsAPIService();
    this.alphaVantage = new AlphaVantageAPIService();
    this.yahooFinance = new YahooFinanceAPIService();
    this.twelveData = new TwelveDataAPIService();
    this.newsClassifier = new NewsClassificationService();
    
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  async getStockData(symbol) {
    const cacheKey = `stock_${symbol}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // Try Twelve Data first (reliable and free)
      let stockData = await this.twelveData.getStockPrice(symbol);
      
      // Fallback to mock data if API fails
      if (!stockData) {
        console.log(`Twelve Data failed for ${symbol}, using fallback data`);
        stockData = this.generateMockStockData(symbol);
      }

      if (stockData) {
        this.setCache(cacheKey, stockData);
      }

      return stockData;

    } catch (error) {
      console.error('Error aggregating stock data:', error.message);
      return null;
    }
  }

  generateMockStockData(symbol) {
    // Generate realistic current market data based on recent actual prices (June 2025)
    const stockPrices = {
      'AAPL': { base: 196.45, change: -2.75, name: 'Apple Inc.', sector: 'Technology' },
      'TSLA': { base: 246.39, change: -4.82, name: 'Tesla Inc.', sector: 'Automotive' },
      'GOOGL': { base: 179.52, change: 1.85, name: 'Alphabet Inc.', sector: 'Technology' },
      'MSFT': { base: 473.21, change: -0.09, name: 'Microsoft Corp.', sector: 'Technology' },
      'NVDA': { base: 141.61, change: -2.87, name: 'NVIDIA Corp.', sector: 'Technology' },
      'META': { base: 628.35, change: -1.25, name: 'Meta Platforms Inc.', sector: 'Technology' },
      'AMZN': { base: 219.85, change: 0.45, name: 'Amazon.com Inc.', sector: 'Consumer Discretionary' },
      'NFLX': { base: 925.15, change: -2.35, name: 'Netflix Inc.', sector: 'Communication Services' }
    };

    const stock = stockPrices[symbol.toUpperCase()] || {
      base: 100 + Math.random() * 500,
      change: (Math.random() - 0.5) * 10,
      name: `${symbol} Inc.`,
      sector: 'Technology'
    };

    const price = stock.base + (Math.random() - 0.5) * 5; // Add some realistic variation
    const change = stock.change + (Math.random() - 0.5) * 2;
    const changePercent = (change / (price - change)) * 100;

    return {
      symbol: symbol.toUpperCase(),
      price: Math.round(price * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      volume: Math.floor(Math.random() * 100000000) + 10000000,
      previousClose: Math.round((price - change) * 100) / 100,
      open: Math.round((price + (Math.random() - 0.5) * 3) * 100) / 100,
      high: Math.round((price + Math.abs(Math.random() * 5)) * 100) / 100,
      low: Math.round((price - Math.abs(Math.random() * 5)) * 100) / 100,
      lastUpdated: new Date().toISOString(),
      source: 'Demo Data',
      profile: {
        symbol: symbol.toUpperCase(),
        name: stock.name,
        sector: stock.sector,
        industry: 'Technology Services',
        marketCap: Math.floor(Math.random() * 2000000000000) + 100000000000,
        peRatio: Math.round((15 + Math.random() * 20) * 100) / 100,
        description: `${stock.name} is a leading company in the ${stock.sector.toLowerCase()} sector.`
      }
    };
  }

  async getStockNews(symbol, options = {}) {
    const cacheKey = `news_${symbol}_${JSON.stringify(options)}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const newsPromises = [];

      // Gather news from multiple sources
      newsPromises.push(
        this.newsAPI.getStockNews(symbol, options)
          .catch(err => {
            console.warn('NewsAPI failed:', err.message);
            return [];
          })
      );

      newsPromises.push(
        this.alphaVantage.getStockNews(symbol, options)
          .catch(err => {
            console.warn('Alpha Vantage news failed:', err.message);
            return [];
          })
      );

      const newsResults = await Promise.all(newsPromises);
      const allNews = newsResults.flat();

      // Deduplicate articles
      const uniqueNews = this.deduplicateNews(allNews);

      // Classify each article
      const stockData = await this.getStockData(symbol);
      const sector = stockData?.sector || 'Technology';

      const classifiedNews = await Promise.all(
        uniqueNews.map(async (article) => {
          try {
            const classification = await this.newsClassifier.classifyNews(article, symbol, sector);
            return {
              ...article,
              classification,
              relevanceScore: classification.relevance,
              sentimentScore: classification.sentiment
            };
          } catch (error) {
            console.warn('Classification failed for article:', article.title);
            return {
              ...article,
              classification: { type: { category: 'unrelated' } },
              relevanceScore: 0,
              sentimentScore: 0
            };
          }
        })
      );

      // Sort by relevance and recency
      const sortedNews = classifiedNews
        .filter(article => article.relevanceScore > 0.1)
        .sort((a, b) => {
          const relevanceDiff = b.relevanceScore - a.relevanceScore;
          if (Math.abs(relevanceDiff) > 0.2) return relevanceDiff;
          
          // If relevance is similar, sort by recency
          const dateA = new Date(a.publishedAt || 0);
          const dateB = new Date(b.publishedAt || 0);
          return dateB - dateA;
        });

      this.setCache(cacheKey, sortedNews);
      return sortedNews;

    } catch (error) {
      console.error('Error aggregating news:', error.message);
      return [];
    }
  }

  async getMarketOverview() {
    const cacheKey = 'market_overview';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const [marketData, sectorData, generalNews] = await Promise.all([
        this.yahooFinance.getMarketData().catch(() => ({})),
        this.yahooFinance.getSectorData().catch(() => ({})),
        this.newsAPI.getGeneralMarketNews({ pageSize: 20 }).catch(() => [])
      ]);

      const overview = {
        marketIndices: marketData,
        sectorPerformance: sectorData,
        topNews: generalNews.slice(0, 10),
        lastUpdated: new Date().toISOString()
      };

      this.setCache(cacheKey, overview, 2 * 60 * 1000); // 2 minutes cache
      return overview;

    } catch (error) {
      console.error('Error getting market overview:', error.message);
      return {
        marketIndices: {},
        sectorPerformance: {},
        topNews: [],
        lastUpdated: new Date().toISOString()
      };
    }
  }

  async getHistoricalData(symbol, period = '1mo', interval = '1d') {
    const cacheKey = `historical_${symbol}_${period}_${interval}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // Try Yahoo Finance first
      let data = await this.yahooFinance.getHistoricalData(symbol, period, interval);
      
      // Fallback to Alpha Vantage for daily data
      if (!data && interval === '1d') {
        const alphaData = await this.alphaVantage.getHistoricalData(symbol, 'daily');
        if (alphaData) {
          data = {
            symbol,
            period,
            interval,
            data: alphaData.data,
            source: 'Alpha Vantage'
          };
        }
      }

      if (data) {
        this.setCache(cacheKey, data, 15 * 60 * 1000); // 15 minutes cache
      }

      return data;

    } catch (error) {
      console.error('Error getting historical data:', error.message);
      return null;
    }
  }

  async getCompanyProfile(symbol) {
    const cacheKey = `profile_${symbol}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // Try Alpha Vantage first for comprehensive data
      let profile = await this.alphaVantage.getCompanyOverview(symbol);
      
      // Fallback to Yahoo Finance
      if (!profile) {
        profile = await this.yahooFinance.getCompanyProfile(symbol);
      }

      if (profile) {
        this.setCache(cacheKey, profile, 60 * 60 * 1000); // 1 hour cache
      }

      return profile;

    } catch (error) {
      console.error('Error getting company profile:', error.message);
      return null;
    }
  }

  async searchStocks(query) {
    try {
      const results = await this.yahooFinance.searchStocks(query);
      return results.filter(stock => 
        stock.quoteType === 'EQUITY' && 
        stock.exchange && 
        !stock.symbol.includes('.')
      ).slice(0, 10);

    } catch (error) {
      console.error('Error searching stocks:', error.message);
      return [];
    }
  }

  async generateComprehensiveReport(symbol) {
    try {
      const [stockData, newsData, historicalData, companyProfile] = await Promise.all([
        this.getStockData(symbol),
        this.getStockNews(symbol),
        this.getHistoricalData(symbol, '1mo'),
        this.getCompanyProfile(symbol)
      ]);

      if (!stockData) {
        throw new Error(`No data found for symbol: ${symbol}`);
      }

      // Generate daily summary
      const dailySummary = await this.newsClassifier.generateDailySummary(
        symbol, 
        stockData, 
        newsData
      );

      return {
        symbol: symbol.toUpperCase(),
        stockData,
        companyProfile,
        newsData,
        historicalData,
        dailySummary,
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error generating comprehensive report:', error.message);
      throw error;
    }
  }

  async calculateAverageVolume(symbol, days = 20) {
    try {
      const historicalData = await this.getHistoricalData(symbol, '1mo', '1d');
      if (!historicalData || !historicalData.data || historicalData.data.length < days) {
        return null;
      }

      const volumes = historicalData.data
        .slice(0, days)
        .map(day => day.volume)
        .filter(volume => volume && volume > 0);

      if (volumes.length === 0) return null;

      return Math.round(volumes.reduce((sum, volume) => sum + volume, 0) / volumes.length);

    } catch (error) {
      console.warn('Error calculating average volume:', error.message);
      return null;
    }
  }

  deduplicateNews(articles) {
    const seen = new Set();
    const uniqueArticles = [];

    for (const article of articles) {
      // Create a key based on title similarity and URL
      const titleKey = article.title?.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 50);
      const urlKey = article.url;
      const key = urlKey || titleKey;

      if (!seen.has(key)) {
        seen.add(key);
        uniqueArticles.push(article);
      }
    }

    return uniqueArticles;
  }

  // Cache management
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  setCache(key, data, customTimeout = null) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      timeout: customTimeout || this.cacheTimeout
    });
  }

  clearCache() {
    this.cache.clear();
  }

  // Health check for all services
  async checkAllServicesHealth() {
    const [newsAPIHealth, alphaVantageHealth, yahooFinanceHealth, twelveDataHealth] = await Promise.all([
      this.newsAPI.checkAPIHealth().catch(err => ({ service: 'NewsAPI', status: 'error', error: err.message })),
      this.alphaVantage.checkAPIHealth().catch(err => ({ service: 'Alpha Vantage', status: 'error', error: err.message })),
      this.yahooFinance.checkAPIHealth().catch(err => ({ service: 'Yahoo Finance', status: 'error', error: err.message })),
      this.twelveData.checkHealth().catch(err => ({ service: 'Twelve Data', status: 'error', error: err.message }))
    ]);

    return {
      services: [newsAPIHealth, alphaVantageHealth, yahooFinanceHealth, twelveDataHealth],
      cacheSize: this.cache.size,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = DataAggregatorService;
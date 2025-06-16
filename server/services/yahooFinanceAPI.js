const axios = require('axios');

class YahooFinanceAPIService {
  constructor() {
    this.baseURL = 'https://query1.finance.yahoo.com/v8/finance/chart';
    this.searchURL = 'https://query1.finance.yahoo.com/v1/finance/search';
    this.quotesURL = 'https://query1.finance.yahoo.com/v7/finance/quote';
    this.newsURL = 'https://query1.finance.yahoo.com/v1/finance/screener';
    this.rateLimitDelay = 500; // 500ms between requests
    this.lastRequestTime = 0;
  }

  async waitForRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.rateLimitDelay) {
      await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay - timeSinceLastRequest));
    }
    this.lastRequestTime = Date.now();
  }

  async getStockPrice(symbol) {
    try {
      await this.waitForRateLimit();

      const response = await axios.get(this.quotesURL, {
        params: {
          symbols: symbol,
          fields: 'regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketVolume,regularMarketPreviousClose,regularMarketOpen,regularMarketDayHigh,regularMarketDayLow,marketCap,trailingPE,forwardPE,dividendYield,earningsTimestamp,sharesOutstanding,floatShares,shortName,longName,sector,industry'
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const quote = response.data.quoteResponse.result[0];
      if (!quote) {
        throw new Error('No quote data received');
      }

      return {
        symbol: quote.symbol,
        price: quote.regularMarketPrice,
        change: quote.regularMarketChange,
        changePercent: quote.regularMarketChangePercent,
        volume: quote.regularMarketVolume,
        previousClose: quote.regularMarketPreviousClose,
        open: quote.regularMarketOpen,
        high: quote.regularMarketDayHigh,
        low: quote.regularMarketDayLow,
        marketCap: quote.marketCap,
        peRatio: quote.trailingPE,
        forwardPE: quote.forwardPE,
        dividendYield: quote.dividendYield,
        sharesOutstanding: quote.sharesOutstanding,
        floatShares: quote.floatShares,
        shortName: quote.shortName,
        longName: quote.longName,
        sector: quote.sector,
        industry: quote.industry,
        earningsTimestamp: quote.earningsTimestamp,
        lastUpdated: new Date().toISOString(),
        source: 'Yahoo Finance'
      };

    } catch (error) {
      console.error('Yahoo Finance stock price error:', error.response?.data || error.message);
      return null;
    }
  }

  async getHistoricalData(symbol, period = '1mo', interval = '1d') {
    try {
      await this.waitForRateLimit();

      const periodMap = {
        '1d': '1d',
        '5d': '5d',
        '1mo': '1mo',
        '3mo': '3mo',
        '6mo': '6mo',
        '1y': '1y',
        '2y': '2y',
        '5y': '5y',
        '10y': '10y',
        'ytd': 'ytd',
        'max': 'max'
      };

      const intervalMap = {
        '1m': '1m',
        '2m': '2m',
        '5m': '5m',
        '15m': '15m',
        '30m': '30m',
        '60m': '60m',
        '90m': '90m',
        '1h': '1h',
        '1d': '1d',
        '5d': '5d',
        '1wk': '1wk',
        '1mo': '1mo',
        '3mo': '3mo'
      };

      const response = await axios.get(`${this.baseURL}/${symbol}`, {
        params: {
          period1: this.getPeriodTimestamp(periodMap[period] || period),
          period2: Math.floor(Date.now() / 1000),
          interval: intervalMap[interval] || interval,
          includePrePost: true,
          events: 'div,splits'
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const chart = response.data.chart.result[0];
      if (!chart || !chart.timestamp) {
        throw new Error('No historical data received');
      }

      const timestamps = chart.timestamp;
      const quotes = chart.indicators.quote[0];
      
      const data = timestamps.map((timestamp, index) => ({
        date: new Date(timestamp * 1000).toISOString().split('T')[0],
        timestamp: timestamp,
        open: quotes.open[index],
        high: quotes.high[index],
        low: quotes.low[index],
        close: quotes.close[index],
        volume: quotes.volume[index]
      })).filter(item => item.close !== null);

      return {
        symbol,
        period,
        interval,
        data: data.reverse(), // Most recent first
        source: 'Yahoo Finance'
      };

    } catch (error) {
      console.error('Yahoo Finance historical data error:', error.response?.data || error.message);
      return null;
    }
  }

  async searchStocks(query) {
    try {
      await this.waitForRateLimit();

      const response = await axios.get(this.searchURL, {
        params: {
          q: query,
          quotesCount: 10,
          newsCount: 0
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const quotes = response.data.quotes || [];
      
      return quotes.map(quote => ({
        symbol: quote.symbol,
        shortName: quote.shortname,
        longName: quote.longname,
        sector: quote.sector,
        industry: quote.industry,
        exchange: quote.exchange,
        quoteType: quote.quoteType,
        score: quote.score
      }));

    } catch (error) {
      console.error('Yahoo Finance search error:', error.response?.data || error.message);
      return [];
    }
  }

  async getMarketData() {
    try {
      await this.waitForRateLimit();

      const indices = ['^GSPC', '^DJI', '^IXIC', '^RUT']; // S&P 500, Dow, NASDAQ, Russell 2000
      const symbols = indices.join(',');

      const response = await axios.get(this.quotesURL, {
        params: {
          symbols: symbols,
          fields: 'regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketVolume'
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const quotes = response.data.quoteResponse.result;
      
      return quotes.reduce((acc, quote) => {
        const name = this.getIndexName(quote.symbol);
        acc[name] = {
          symbol: quote.symbol,
          price: quote.regularMarketPrice,
          change: quote.regularMarketChange,
          changePercent: quote.regularMarketChangePercent,
          volume: quote.regularMarketVolume
        };
        return acc;
      }, {});

    } catch (error) {
      console.error('Yahoo Finance market data error:', error.response?.data || error.message);
      return {};
    }
  }

  async getSectorData() {
    try {
      await this.waitForRateLimit();

      const sectorETFs = [
        'XLK', // Technology
        'XLF', // Financial
        'XLV', // Healthcare
        'XLE', // Energy
        'XLI', // Industrial
        'XLY', // Consumer Discretionary
        'XLP', // Consumer Staples
        'XLU', // Utilities
        'XLB', // Materials
        'XLRE', // Real Estate
        'XLC' // Communication Services
      ];

      const symbols = sectorETFs.join(',');

      const response = await axios.get(this.quotesURL, {
        params: {
          symbols: symbols,
          fields: 'regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketVolume,shortName'
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const quotes = response.data.quoteResponse.result;
      
      return quotes.reduce((acc, quote) => {
        acc[quote.symbol] = {
          symbol: quote.symbol,
          name: quote.shortName,
          price: quote.regularMarketPrice,
          change: quote.regularMarketChange,
          changePercent: quote.regularMarketChangePercent,
          volume: quote.regularMarketVolume
        };
        return acc;
      }, {});

    } catch (error) {
      console.error('Yahoo Finance sector data error:', error.response?.data || error.message);
      return {};
    }
  }

  async getCompanyProfile(symbol) {
    try {
      await this.waitForRateLimit();

      // Yahoo Finance doesn't have a direct company profile endpoint
      // We'll use the quote endpoint to get available company information
      const quote = await this.getStockPrice(symbol);
      
      if (!quote) return null;

      return {
        symbol: quote.symbol,
        shortName: quote.shortName,
        longName: quote.longName,
        sector: quote.sector,
        industry: quote.industry,
        marketCap: quote.marketCap,
        peRatio: quote.peRatio,
        forwardPE: quote.forwardPE,
        dividendYield: quote.dividendYield,
        sharesOutstanding: quote.sharesOutstanding,
        floatShares: quote.floatShares,
        earningsTimestamp: quote.earningsTimestamp,
        source: 'Yahoo Finance'
      };

    } catch (error) {
      console.error('Yahoo Finance company profile error:', error.response?.data || error.message);
      return null;
    }
  }

  // Helper methods
  getPeriodTimestamp(period) {
    const now = Date.now();
    const periods = {
      '1d': now - (24 * 60 * 60 * 1000),
      '5d': now - (5 * 24 * 60 * 60 * 1000),
      '1mo': now - (30 * 24 * 60 * 60 * 1000),
      '3mo': now - (90 * 24 * 60 * 60 * 1000),
      '6mo': now - (180 * 24 * 60 * 60 * 1000),
      '1y': now - (365 * 24 * 60 * 60 * 1000),
      '2y': now - (2 * 365 * 24 * 60 * 60 * 1000),
      '5y': now - (5 * 365 * 24 * 60 * 60 * 1000),
      '10y': now - (10 * 365 * 24 * 60 * 60 * 1000),
      'ytd': new Date(new Date().getFullYear(), 0, 1).getTime(),
      'max': 0
    };
    
    return Math.floor((periods[period] || periods['1mo']) / 1000);
  }

  getIndexName(symbol) {
    const names = {
      '^GSPC': 'SP500',
      '^DJI': 'DOW',
      '^IXIC': 'NASDAQ',
      '^RUT': 'RUSSELL2000'
    };
    return names[symbol] || symbol;
  }

  async checkAPIHealth() {
    try {
      const quote = await this.getStockPrice('AAPL');
      return {
        service: 'Yahoo Finance',
        status: quote ? 'healthy' : 'error',
        rateLimitDelay: this.rateLimitDelay
      };
    } catch (error) {
      return {
        service: 'Yahoo Finance',
        status: 'error',
        error: error.message
      };
    }
  }
}

module.exports = YahooFinanceAPIService;
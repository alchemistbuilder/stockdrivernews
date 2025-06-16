const axios = require('axios');

class TwelveDataAPIService {
  constructor() {
    this.apiKey = process.env.TWELVE_DATA_API_KEY || 'demo';
    this.baseURL = 'https://api.twelvedata.com';
    this.rateLimitDelay = 1000; // 1 second between requests for free tier
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

      const response = await axios.get(`${this.baseURL}/quote`, {
        params: {
          symbol: symbol,
          apikey: this.apiKey
        }
      });

      const data = response.data;
      
      if (data.code && data.code !== 200) {
        throw new Error(data.message || 'API error');
      }

      return {
        symbol: data.symbol,
        price: parseFloat(data.close),
        change: parseFloat(data.change),
        changePercent: parseFloat(data.percent_change),
        volume: parseInt(data.volume),
        previousClose: parseFloat(data.previous_close),
        open: parseFloat(data.open),
        high: parseFloat(data.high),
        low: parseFloat(data.low),
        lastUpdated: new Date().toISOString(),
        source: 'Twelve Data',
        marketCap: null, // Not provided by this endpoint
        profile: {
          symbol: data.symbol,
          name: data.name,
          exchange: data.exchange,
          currency: data.currency,
          sector: 'Technology', // Default - would need separate call for this
          industry: 'Technology Services',
          marketCap: null,
          avgVolume: parseInt(data.average_volume) || null,
          week52High: data.fifty_two_week?.high ? parseFloat(data.fifty_two_week.high) : null,
          week52Low: data.fifty_two_week?.low ? parseFloat(data.fifty_two_week.low) : null
        }
      };

    } catch (error) {
      console.error('Twelve Data API error:', error.response?.data || error.message);
      return null;
    }
  }

  async getMultipleStockPrices(symbols) {
    try {
      await this.waitForRateLimit();

      // For free tier, we'll make individual requests
      // Premium tier supports batch requests
      const results = [];
      
      for (const symbol of symbols) {
        try {
          const stockData = await this.getStockPrice(symbol);
          if (stockData) {
            results.push(stockData);
          }
          // Small delay between requests
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.warn(`Failed to fetch ${symbol}:`, error.message);
        }
      }

      return results;

    } catch (error) {
      console.error('Twelve Data batch error:', error.message);
      return [];
    }
  }

  async getIntradayData(symbol, interval = '1min', outputsize = 30) {
    try {
      await this.waitForRateLimit();

      const response = await axios.get(`${this.baseURL}/time_series`, {
        params: {
          symbol: symbol,
          interval: interval,
          outputsize: outputsize,
          apikey: this.apiKey
        }
      });

      const data = response.data;
      
      if (data.code && data.code !== 200) {
        throw new Error(data.message || 'API error');
      }

      if (!data.values) {
        return [];
      }

      return data.values.map(item => ({
        datetime: item.datetime,
        open: parseFloat(item.open),
        high: parseFloat(item.high),
        low: parseFloat(item.low),
        close: parseFloat(item.close),
        volume: parseInt(item.volume)
      }));

    } catch (error) {
      console.error('Twelve Data intraday error:', error.response?.data || error.message);
      return [];
    }
  }

  async checkHealth() {
    try {
      const testData = await this.getStockPrice('AAPL');
      return {
        service: 'Twelve Data',
        status: testData ? 'healthy' : 'degraded',
        message: testData ? 'Real-time data available' : 'No data returned',
        lastPrice: testData?.price || null
      };
    } catch (error) {
      return {
        service: 'Twelve Data',
        status: 'error',
        error: error.message
      };
    }
  }
}

module.exports = TwelveDataAPIService;
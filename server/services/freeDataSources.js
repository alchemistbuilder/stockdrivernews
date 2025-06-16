const axios = require('axios');

class FreeDataSourcesService {
  constructor() {
    this.baseURLs = {
      iexCloud: 'https://cloud.iexapis.com/stable',
      finnhub: 'https://finnhub.io/api/v1',
      fmp: 'https://financialmodelingprep.com/api/v3',
      fred: 'https://api.stlouisfed.org/fred',
      secEdgar: 'https://data.sec.gov'
    };
    
    this.rateLimits = {
      iexCloud: 100, // requests per second for free tier
      finnhub: 1000, // 60 per minute = ~1000ms between requests
      fmp: 2000, // Conservative rate limiting
      fred: 1000,
      secEdgar: 10000 // SEC allows 10 requests per second
    };
    
    this.lastRequestTimes = {};
  }

  async waitForRateLimit(service) {
    const now = Date.now();
    const lastRequest = this.lastRequestTimes[service] || 0;
    const timeSinceLastRequest = now - lastRequest;
    const requiredDelay = this.rateLimits[service];
    
    if (timeSinceLastRequest < requiredDelay) {
      await new Promise(resolve => setTimeout(resolve, requiredDelay - timeSinceLastRequest));
    }
    
    this.lastRequestTimes[service] = Date.now();
  }

  // IEX Cloud - Free tier available
  async getIEXStockData(symbol) {
    try {
      await this.waitForRateLimit('iexCloud');
      
      // Using free sandbox environment - replace with production URL when you get a key
      const sandboxURL = 'https://sandbox.iexapis.com/stable';
      
      const response = await axios.get(`${sandboxURL}/stock/${symbol}/quote`, {
        params: {
          token: process.env.IEX_CLOUD_API_KEY || 'Tpk_059b97af715d417d9f49f50b51b1c448' // Sandbox token
        }
      });
      
      return {
        symbol: response.data.symbol,
        price: response.data.latestPrice,
        change: response.data.change,
        changePercent: response.data.changePercent * 100,
        volume: response.data.latestVolume,
        marketCap: response.data.marketCap,
        peRatio: response.data.peRatio,
        week52High: response.data.week52High,
        week52Low: response.data.week52Low,
        source: 'IEX Cloud'
      };
    } catch (error) {
      console.warn('IEX Cloud error:', error.message);
      return null;
    }
  }

  // Financial Modeling Prep - Some free endpoints
  async getFMPStockData(symbol) {
    try {
      await this.waitForRateLimit('fmp');
      
      const response = await axios.get(`${this.baseURLs.fmp}/quote/${symbol}`, {
        params: {
          apikey: process.env.FMP_API_KEY || 'demo' // Demo key available
        }
      });
      
      if (response.data && response.data.length > 0) {
        const data = response.data[0];
        return {
          symbol: data.symbol,
          price: data.price,
          change: data.change,
          changePercent: data.changesPercentage,
          volume: data.volume,
          marketCap: data.marketCap,
          peRatio: data.pe,
          eps: data.eps,
          source: 'Financial Modeling Prep'
        };
      }
      
      return null;
    } catch (error) {
      console.warn('FMP error:', error.message);
      return null;
    }
  }

  // SEC EDGAR - Always free, no API key needed
  async getSECInsiderTrading(symbol) {
    try {
      await this.waitForRateLimit('secEdgar');
      
      // SEC requires User-Agent header
      const headers = {
        'User-Agent': process.env.SEC_EDGAR_USER_AGENT || 'StockNewsAggregator contact@example.com'
      };
      
      // Search for company CIK first
      const searchResponse = await axios.get('https://www.sec.gov/files/company_tickers.json', {
        headers
      });
      
      // Find company CIK by symbol (simplified - would need better matching in production)
      const companies = Object.values(searchResponse.data);
      const company = companies.find(c => c.ticker === symbol.toUpperCase());
      
      if (!company) {
        return { insider_trades: [], message: 'Company not found in SEC database' };
      }
      
      // Note: SEC API is complex - this is a simplified version
      // In production, you'd parse actual Form 4 filings
      return {
        symbol,
        cik: company.cik_str,
        insider_trades: [],
        message: 'SEC EDGAR integration ready - full implementation requires Form 4 parsing',
        source: 'SEC EDGAR'
      };
      
    } catch (error) {
      console.warn('SEC EDGAR error:', error.message);
      return { insider_trades: [], error: error.message };
    }
  }

  // Federal Reserve Economic Data (FRED) - Always free
  async getFREDEconomicData() {
    try {
      await this.waitForRateLimit('fred');
      
      // Get key economic indicators
      const indicators = [
        'FEDFUNDS', // Federal Funds Rate
        'CPIAUCSL', // Consumer Price Index
        'UNRATE',   // Unemployment Rate
        'GDP'       // Gross Domestic Product
      ];
      
      const apiKey = process.env.FRED_API_KEY || 'demo'; // FRED provides demo access
      
      const economicData = {};
      
      for (const indicator of indicators) {
        try {
          const response = await axios.get(`${this.baseURLs.fred}/series/observations`, {
            params: {
              series_id: indicator,
              api_key: apiKey,
              file_type: 'json',
              limit: 1,
              sort_order: 'desc'
            }
          });
          
          if (response.data.observations && response.data.observations.length > 0) {
            const latest = response.data.observations[0];
            economicData[indicator] = {
              value: parseFloat(latest.value),
              date: latest.date
            };
          }
          
          // Small delay between requests
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.warn(`FRED ${indicator} error:`, error.message);
        }
      }
      
      return {
        economicData,
        source: 'Federal Reserve Economic Data'
      };
      
    } catch (error) {
      console.warn('FRED error:', error.message);
      return { economicData: {}, error: error.message };
    }
  }

  // Get free stock data with fallback chain
  async getFreeStockData(symbol) {
    const sources = [
      () => this.getIEXStockData(symbol),
      () => this.getFMPStockData(symbol)
    ];
    
    for (const getSource of sources) {
      try {
        const data = await getSource();
        if (data) return data;
      } catch (error) {
        console.warn(`Free source failed for ${symbol}:`, error.message);
      }
    }
    
    return null;
  }

  // Aggregate free market data
  async getFreeMarketOverview() {
    try {
      const [economicData, spyData, qqqData] = await Promise.all([
        this.getFREDEconomicData().catch(() => ({ economicData: {} })),
        this.getFreeStockData('SPY').catch(() => null),
        this.getFreeStockData('QQQ').catch(() => null)
      ]);
      
      return {
        economicIndicators: economicData.economicData,
        marketIndices: {
          SP500: spyData,
          NASDAQ: qqqData
        },
        lastUpdated: new Date().toISOString(),
        source: 'Free Data Sources'
      };
      
    } catch (error) {
      console.error('Free market overview error:', error.message);
      return {
        economicIndicators: {},
        marketIndices: {},
        lastUpdated: new Date().toISOString(),
        error: error.message
      };
    }
  }

  // Check health of free services
  async checkFreeServicesHealth() {
    const healthChecks = [];
    
    // Test IEX Cloud
    try {
      const iexData = await this.getIEXStockData('AAPL');
      healthChecks.push({
        service: 'IEX Cloud',
        status: iexData ? 'healthy' : 'degraded',
        message: iexData ? 'Sandbox working' : 'No data returned'
      });
    } catch (error) {
      healthChecks.push({
        service: 'IEX Cloud',
        status: 'error',
        error: error.message
      });
    }
    
    // Test FMP
    try {
      const fmpData = await this.getFMPStockData('AAPL');
      healthChecks.push({
        service: 'Financial Modeling Prep',
        status: fmpData ? 'healthy' : 'degraded',
        message: fmpData ? 'Demo API working' : 'No data returned'
      });
    } catch (error) {
      healthChecks.push({
        service: 'Financial Modeling Prep',
        status: 'error',
        error: error.message
      });
    }
    
    // Test FRED
    try {
      const fredData = await this.getFREDEconomicData();
      healthChecks.push({
        service: 'Federal Reserve FRED',
        status: Object.keys(fredData.economicData).length > 0 ? 'healthy' : 'degraded',
        message: `${Object.keys(fredData.economicData).length} indicators available`
      });
    } catch (error) {
      healthChecks.push({
        service: 'Federal Reserve FRED',
        status: 'error',
        error: error.message
      });
    }
    
    return {
      freeServices: healthChecks,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = FreeDataSourcesService;
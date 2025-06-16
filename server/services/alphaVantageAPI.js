const axios = require('axios');

class AlphaVantageAPIService {
  constructor() {
    this.apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    this.baseURL = 'https://www.alphavantage.co/query';
    this.rateLimitDelay = 12000; // 12 seconds for free tier (5 requests per minute)
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
    if (!this.apiKey) {
      console.warn('Alpha Vantage API key not configured');
      return null;
    }

    try {
      await this.waitForRateLimit();

      const response = await axios.get(this.baseURL, {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: symbol,
          apikey: this.apiKey
        }
      });

      const quote = response.data['Global Quote'];
      if (!quote || Object.keys(quote).length === 0) {
        throw new Error('No quote data received');
      }

      return {
        symbol: quote['01. symbol'],
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
        volume: parseInt(quote['06. volume']),
        previousClose: parseFloat(quote['08. previous close']),
        open: parseFloat(quote['02. open']),
        high: parseFloat(quote['03. high']),
        low: parseFloat(quote['04. low']),
        lastUpdated: quote['07. latest trading day'],
        source: 'Alpha Vantage'
      };

    } catch (error) {
      console.error('Alpha Vantage stock price error:', error.response?.data || error.message);
      return null;
    }
  }

  async getStockNews(symbol, options = {}) {
    if (!this.apiKey) {
      console.warn('Alpha Vantage API key not configured');
      return [];
    }

    try {
      await this.waitForRateLimit();

      const {
        topics = 'technology,earnings',
        time_from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        sort = 'LATEST',
        limit = 50
      } = options;

      const response = await axios.get(this.baseURL, {
        params: {
          function: 'NEWS_SENTIMENT',
          tickers: symbol,
          topics,
          time_from,
          sort,
          limit,
          apikey: this.apiKey
        }
      });

      if (!response.data.feed) {
        return [];
      }

      return response.data.feed.map(article => this.formatNewsArticle(article, symbol));

    } catch (error) {
      console.error('Alpha Vantage news error:', error.response?.data || error.message);
      return [];
    }
  }

  async getHistoricalData(symbol, interval = 'daily', outputSize = 'compact') {
    if (!this.apiKey) {
      console.warn('Alpha Vantage API key not configured');
      return null;
    }

    try {
      await this.waitForRateLimit();

      const functionMap = {
        'daily': 'TIME_SERIES_DAILY',
        'weekly': 'TIME_SERIES_WEEKLY',
        'monthly': 'TIME_SERIES_MONTHLY',
        'intraday': 'TIME_SERIES_INTRADAY'
      };

      const params = {
        function: functionMap[interval] || 'TIME_SERIES_DAILY',
        symbol: symbol,
        outputsize: outputSize,
        apikey: this.apiKey
      };

      if (interval === 'intraday') {
        params.interval = '5min';
      }

      const response = await axios.get(this.baseURL, { params });

      // Parse the time series data
      const data = response.data;
      const timeSeriesKey = Object.keys(data).find(key => key.includes('Time Series'));
      
      if (!timeSeriesKey || !data[timeSeriesKey]) {
        throw new Error('No time series data found');
      }

      const timeSeries = data[timeSeriesKey];
      const formattedData = Object.entries(timeSeries).map(([date, values]) => ({
        date,
        open: parseFloat(values['1. open']),
        high: parseFloat(values['2. high']),
        low: parseFloat(values['3. low']),
        close: parseFloat(values['4. close']),
        volume: parseInt(values['5. volume'])
      }));

      return {
        symbol,
        interval,
        data: formattedData.sort((a, b) => new Date(b.date) - new Date(a.date)),
        source: 'Alpha Vantage'
      };

    } catch (error) {
      console.error('Alpha Vantage historical data error:', error.response?.data || error.message);
      return null;
    }
  }

  async getCompanyOverview(symbol) {
    if (!this.apiKey) {
      console.warn('Alpha Vantage API key not configured');
      return null;
    }

    try {
      await this.waitForRateLimit();

      const response = await axios.get(this.baseURL, {
        params: {
          function: 'OVERVIEW',
          symbol: symbol,
          apikey: this.apiKey
        }
      });

      const overview = response.data;
      if (!overview.Symbol) {
        throw new Error('No company overview data found');
      }

      return {
        symbol: overview.Symbol,
        name: overview.Name,
        description: overview.Description,
        sector: overview.Sector,
        industry: overview.Industry,
        marketCap: parseInt(overview.MarketCapitalization) || 0,
        peRatio: parseFloat(overview.PERatio) || null,
        pegRatio: parseFloat(overview.PEGRatio) || null,
        bookValue: parseFloat(overview.BookValue) || null,
        dividendYield: parseFloat(overview.DividendYield) || null,
        eps: parseFloat(overview.EPS) || null,
        revenuePerShareTTM: parseFloat(overview.RevenuePerShareTTM) || null,
        profitMargin: parseFloat(overview.ProfitMargin) || null,
        operatingMarginTTM: parseFloat(overview.OperatingMarginTTM) || null,
        returnOnAssetsTTM: parseFloat(overview.ReturnOnAssetsTTM) || null,
        returnOnEquityTTM: parseFloat(overview.ReturnOnEquityTTM) || null,
        revenueTTM: parseInt(overview.RevenueTTM) || null,
        grossProfitTTM: parseInt(overview.GrossProfitTTM) || null,
        dilutedEPSTTM: parseFloat(overview.DilutedEPSTTM) || null,
        quarterlyEarningsGrowthYOY: parseFloat(overview.QuarterlyEarningsGrowthYOY) || null,
        quarterlyRevenueGrowthYOY: parseFloat(overview.QuarterlyRevenueGrowthYOY) || null,
        analystTargetPrice: parseFloat(overview.AnalystTargetPrice) || null,
        week52High: parseFloat(overview['52WeekHigh']) || null,
        week52Low: parseFloat(overview['52WeekLow']) || null,
        movingAverage50Day: parseFloat(overview['50DayMovingAverage']) || null,
        movingAverage200Day: parseFloat(overview['200DayMovingAverage']) || null,
        sharesOutstanding: parseInt(overview.SharesOutstanding) || null,
        sharesFloat: parseInt(overview.SharesFloat) || null,
        sharesShort: parseInt(overview.SharesShort) || null,
        sharesShortPriorMonth: parseInt(overview.SharesShortPriorMonth) || null,
        shortRatio: parseFloat(overview.ShortRatio) || null,
        shortPercentOutstanding: parseFloat(overview.ShortPercentOutstanding) || null,
        shortPercentFloat: parseFloat(overview.ShortPercentFloat) || null,
        percentInsiders: parseFloat(overview.PercentInsiders) || null,
        percentInstitutions: parseFloat(overview.PercentInstitutions) || null,
        forwardPE: parseFloat(overview.ForwardPE) || null,
        priceToBooksRatio: parseFloat(overview.PriceToBookRatio) || null,
        priceToSalesRatioTTM: parseFloat(overview.PriceToSalesRatioTTM) || null,
        priceToFreeCashFlowTTM: parseFloat(overview.PriceToFreeCashFlowTTM) || null,
        trailingPE: parseFloat(overview.TrailingPE) || null,
        enterpriseValue: parseInt(overview.EnterpriseValue) || null,
        enterpriseToRevenue: parseFloat(overview.EnterpriseToRevenue) || null,
        enterpriseToEBITDA: parseFloat(overview.EnterpriseToEBITDA) || null,
        source: 'Alpha Vantage'
      };

    } catch (error) {
      console.error('Alpha Vantage company overview error:', error.response?.data || error.message);
      return null;
    }
  }

  formatNewsArticle(article, symbol) {
    return {
      id: this.generateArticleId(article.url),
      title: article.title,
      description: article.summary,
      content: article.summary,
      url: article.url,
      source: article.source,
      author: article.authors?.join(', '),
      publishedAt: article.time_published,
      urlToImage: article.banner_image,
      sentiment: {
        score: parseFloat(article.overall_sentiment_score),
        label: article.overall_sentiment_label
      },
      tickerSentiment: article.ticker_sentiment?.find(t => t.ticker === symbol) || null,
      relevanceScore: article.relevance_score ? parseFloat(article.relevance_score) : null,
      topics: article.topics || [],
      apiSource: 'Alpha Vantage',
      rawData: article
    };
  }

  generateArticleId(url) {
    return Buffer.from(url || Date.now().toString()).toString('base64').slice(0, 16);
  }

  async checkAPIHealth() {
    try {
      const response = await axios.get(this.baseURL, {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: 'AAPL',
          apikey: this.apiKey
        }
      });
      
      if (response.data.Note) {
        return {
          service: 'Alpha Vantage',
          status: 'rate_limited',
          message: response.data.Note
        };
      }

      return {
        service: 'Alpha Vantage',
        status: 'healthy',
        rateLimitDelay: this.rateLimitDelay
      };
    } catch (error) {
      return {
        service: 'Alpha Vantage',
        status: 'error',
        error: error.response?.data || error.message
      };
    }
  }
}

module.exports = AlphaVantageAPIService;
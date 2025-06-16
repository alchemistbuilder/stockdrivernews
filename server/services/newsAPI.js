const axios = require('axios');

class NewsAPIService {
  constructor() {
    this.apiKey = process.env.NEWS_API_KEY;
    this.baseURL = 'https://newsapi.org/v2';
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

  async getStockNews(stockSymbol, options = {}) {
    if (!this.apiKey) {
      console.warn('NewsAPI key not configured');
      return [];
    }

    try {
      await this.waitForRateLimit();

      const {
        from = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Yesterday
        to = new Date().toISOString().split('T')[0], // Today
        language = 'en',
        sortBy = 'publishedAt'
      } = options;

      // Search for company ticker and common variations
      const queries = [
        stockSymbol,
        `"${stockSymbol}"`,
        this.getCompanyName(stockSymbol)
      ].filter(Boolean);

      const allArticles = [];

      for (const query of queries) {
        const response = await axios.get(`${this.baseURL}/everything`, {
          params: {
            q: query,
            from,
            to,
            language,
            sortBy,
            apiKey: this.apiKey
          }
        });

        if (response.data.articles) {
          allArticles.push(...response.data.articles);
        }

        // Rate limiting
        if (queries.indexOf(query) < queries.length - 1) {
          await this.waitForRateLimit();
        }
      }

      // Deduplicate articles by URL
      const uniqueArticles = this.deduplicateArticles(allArticles);

      return uniqueArticles.map(article => this.formatArticle(article, 'NewsAPI'));

    } catch (error) {
      console.error('NewsAPI error:', error.response?.data || error.message);
      return [];
    }
  }

  async getGeneralMarketNews(options = {}) {
    if (!this.apiKey) {
      console.warn('NewsAPI key not configured');
      return [];
    }

    try {
      await this.waitForRateLimit();

      const {
        category = 'business',
        country = 'us',
        pageSize = 50
      } = options;

      const response = await axios.get(`${this.baseURL}/top-headlines`, {
        params: {
          category,
          country,
          pageSize,
          apiKey: this.apiKey
        }
      });

      return response.data.articles.map(article => 
        this.formatArticle(article, 'NewsAPI')
      );

    } catch (error) {
      console.error('NewsAPI market news error:', error.response?.data || error.message);
      return [];
    }
  }

  async searchNews(query, options = {}) {
    if (!this.apiKey) {
      console.warn('NewsAPI key not configured');
      return [];
    }

    try {
      await this.waitForRateLimit();

      const {
        from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Last week
        to = new Date().toISOString().split('T')[0],
        language = 'en',
        sortBy = 'relevancy',
        pageSize = 50
      } = options;

      const response = await axios.get(`${this.baseURL}/everything`, {
        params: {
          q: query,
          from,
          to,
          language,
          sortBy,
          pageSize,
          apiKey: this.apiKey
        }
      });

      return response.data.articles.map(article => 
        this.formatArticle(article, 'NewsAPI')
      );

    } catch (error) {
      console.error('NewsAPI search error:', error.response?.data || error.message);
      return [];
    }
  }

  formatArticle(article, source) {
    return {
      id: this.generateArticleId(article.url),
      title: article.title,
      description: article.description,
      content: article.content,
      url: article.url,
      source: article.source?.name || source,
      author: article.author,
      publishedAt: article.publishedAt,
      urlToImage: article.urlToImage,
      apiSource: source,
      rawData: article
    };
  }

  deduplicateArticles(articles) {
    const seen = new Set();
    return articles.filter(article => {
      const key = article.url || article.title;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  generateArticleId(url) {
    return Buffer.from(url || Date.now().toString()).toString('base64').slice(0, 16);
  }

  getCompanyName(stockSymbol) {
    // Extended company name mapping
    const companyNames = {
      'AAPL': 'Apple Inc',
      'TSLA': 'Tesla Inc',
      'GOOGL': 'Alphabet Google',
      'GOOG': 'Alphabet Google',
      'MSFT': 'Microsoft Corporation',
      'AMZN': 'Amazon.com',
      'META': 'Meta Facebook',
      'NVDA': 'NVIDIA Corporation',
      'NFLX': 'Netflix Inc',
      'AMD': 'Advanced Micro Devices',
      'INTC': 'Intel Corporation',
      'CRM': 'Salesforce',
      'ORCL': 'Oracle Corporation',
      'IBM': 'International Business Machines',
      'CSCO': 'Cisco Systems',
      'ADBE': 'Adobe Inc',
      'NOW': 'ServiceNow',
      'SNOW': 'Snowflake Inc',
      'PLTR': 'Palantir',
      'CRWD': 'CrowdStrike',
      'ZM': 'Zoom',
      'SHOP': 'Shopify',
      'SQ': 'Block Square',
      'PYPL': 'PayPal',
      'V': 'Visa Inc',
      'MA': 'Mastercard',
      'JPM': 'JPMorgan Chase',
      'BAC': 'Bank of America',
      'WFC': 'Wells Fargo',
      'GS': 'Goldman Sachs',
      'MS': 'Morgan Stanley',
      'BRK.A': 'Berkshire Hathaway',
      'BRK.B': 'Berkshire Hathaway'
    };
    return companyNames[stockSymbol.toUpperCase()];
  }

  // Health check method
  async checkAPIHealth() {
    try {
      const response = await axios.get(`${this.baseURL}/top-headlines`, {
        params: {
          country: 'us',
          pageSize: 1,
          apiKey: this.apiKey
        }
      });
      return {
        service: 'NewsAPI',
        status: 'healthy',
        requestsRemaining: response.headers['x-api-key-requests-remaining-today'],
        requestsLimit: response.headers['x-api-key-requests-limit-today']
      };
    } catch (error) {
      return {
        service: 'NewsAPI',
        status: 'error',
        error: error.response?.data?.message || error.message
      };
    }
  }
}

module.exports = NewsAPIService;
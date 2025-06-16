const axios = require('axios');

class NewsClassificationService {
  constructor() {
    this.stockKeywords = {
      earnings: ['earnings', 'revenue', 'profit', 'eps', 'quarterly results', 'beat estimates', 'miss estimates'],
      management: ['ceo', 'cfo', 'president', 'executive', 'management', 'board', 'leadership'],
      products: ['launch', 'product', 'release', 'innovation', 'patent', 'development'],
      financial: ['acquisition', 'merger', 'buyback', 'dividend', 'debt', 'funding', 'ipo'],
      guidance: ['guidance', 'outlook', 'forecast', 'expectations', 'projections']
    };

    this.industryKeywords = {
      regulatory: ['regulation', 'fda', 'sec', 'government', 'policy', 'compliance'],
      sector: ['industry', 'sector', 'market share', 'competition', 'peer'],
      technology: ['ai', 'artificial intelligence', 'blockchain', 'cloud', 'software'],
      healthcare: ['drug', 'clinical trial', 'pharma', 'medical', 'healthcare'],
      energy: ['oil', 'gas', 'renewable', 'energy', 'petroleum']
    };

    this.macroKeywords = {
      monetary: ['fed', 'federal reserve', 'interest rates', 'inflation', 'monetary policy'],
      economic: ['gdp', 'unemployment', 'recession', 'economic growth', 'consumer spending'],
      geopolitical: ['war', 'conflict', 'sanctions', 'trade war', 'election'],
      market: ['market', 'dow', 'nasdaq', 's&p', 'volatility', 'correction']
    };
  }

  async classifyNews(article, stockSymbol, stockSector) {
    const classification = {
      type: this.determineNewsType(article, stockSymbol, stockSector),
      relevance: this.calculateRelevance(article, stockSymbol),
      sentiment: this.analyzeSentiment(article),
      urgency: this.calculateUrgency(article),
      priceImpact: this.estimatePriceImpact(article),
      confidence: 0
    };

    classification.confidence = this.calculateConfidence(classification, article);
    
    return classification;
  }

  determineNewsType(article, stockSymbol, stockSector) {
    const title = article.title.toLowerCase();
    const content = (article.content || article.description || '').toLowerCase();
    const text = `${title} ${content}`;

    // Check if stock symbol is mentioned directly
    if (text.includes(stockSymbol.toLowerCase()) || 
        text.includes(this.getCompanyName(stockSymbol).toLowerCase())) {
      
      // Further classify stock-specific news
      const stockSpecificType = this.classifyStockSpecific(text);
      return {
        category: 'stock-specific',
        subcategory: stockSpecificType,
        reason: `Direct mention of ${stockSymbol} with ${stockSpecificType} context`
      };
    }

    // Check for competitor mentions
    const competitors = this.getCompetitors(stockSymbol, stockSector);
    const competitorMentioned = competitors.find(comp => 
      text.includes(comp.toLowerCase())
    );
    
    if (competitorMentioned) {
      return {
        category: 'competitor',
        subcategory: 'peer-impact',
        reason: `Competitor ${competitorMentioned} mentioned`,
        affectedCompetitor: competitorMentioned
      };
    }

    // Check for industry/sector relevance
    if (this.isIndustryRelevant(text, stockSector)) {
      const industryType = this.classifyIndustry(text);
      return {
        category: 'industry',
        subcategory: industryType,
        reason: `${stockSector} industry relevance - ${industryType}`
      };
    }

    // Check for macro events
    const macroType = this.classifyMacro(text);
    if (macroType) {
      return {
        category: 'macro',
        subcategory: macroType,
        reason: `Market-wide ${macroType} event`
      };
    }

    return {
      category: 'unrelated',
      subcategory: 'other',
      reason: 'No clear relevance detected'
    };
  }

  classifyStockSpecific(text) {
    for (const [category, keywords] of Object.entries(this.stockKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return category;
      }
    }
    return 'general';
  }

  classifyIndustry(text) {
    for (const [category, keywords] of Object.entries(this.industryKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return category;
      }
    }
    return 'sector-general';
  }

  classifyMacro(text) {
    for (const [category, keywords] of Object.entries(this.macroKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return category;
      }
    }
    return null;
  }

  calculateRelevance(article, stockSymbol) {
    const title = article.title.toLowerCase();
    const content = (article.content || article.description || '').toLowerCase();
    
    let relevanceScore = 0;
    
    // Direct symbol mention
    if (title.includes(stockSymbol.toLowerCase())) relevanceScore += 0.8;
    if (content.includes(stockSymbol.toLowerCase())) relevanceScore += 0.3;
    
    // Company name mention
    const companyName = this.getCompanyName(stockSymbol).toLowerCase();
    if (title.includes(companyName)) relevanceScore += 0.7;
    if (content.includes(companyName)) relevanceScore += 0.2;
    
    // Recency bonus
    const hoursAgo = this.getHoursAgo(article.publishedAt);
    if (hoursAgo < 24) relevanceScore += 0.1;
    if (hoursAgo < 6) relevanceScore += 0.1;
    
    return Math.min(relevanceScore, 1.0);
  }

  analyzeSentiment(article) {
    const text = `${article.title} ${article.content || article.description || ''}`.toLowerCase();
    
    const positiveWords = ['beat', 'exceed', 'growth', 'rise', 'gain', 'positive', 'strong', 'bullish', 'upgrade'];
    const negativeWords = ['miss', 'decline', 'fall', 'drop', 'negative', 'weak', 'bearish', 'downgrade', 'loss'];
    
    let sentiment = 0;
    
    positiveWords.forEach(word => {
      const matches = (text.match(new RegExp(word, 'g')) || []).length;
      sentiment += matches * 0.1;
    });
    
    negativeWords.forEach(word => {
      const matches = (text.match(new RegExp(word, 'g')) || []).length;
      sentiment -= matches * 0.1;
    });
    
    return Math.max(-1, Math.min(1, sentiment));
  }

  calculateUrgency(article) {
    const hoursAgo = this.getHoursAgo(article.publishedAt);
    const title = article.title.toLowerCase();
    
    let urgency = 1.0 - (hoursAgo / 168); // Decay over a week
    
    // Breaking news indicators
    if (title.includes('breaking') || title.includes('urgent')) urgency += 0.3;
    if (title.includes('halted') || title.includes('suspended')) urgency += 0.5;
    
    return Math.max(0, Math.min(1, urgency));
  }

  estimatePriceImpact(article) {
    const title = article.title.toLowerCase();
    const content = (article.content || '').toLowerCase();
    
    // High impact keywords
    const highImpactKeywords = ['earnings', 'acquisition', 'merger', 'fda approval', 'breakthrough'];
    const mediumImpactKeywords = ['guidance', 'partnership', 'contract', 'expansion'];
    const lowImpactKeywords = ['announcement', 'update', 'comment'];
    
    const text = `${title} ${content}`;
    
    if (highImpactKeywords.some(keyword => text.includes(keyword))) return 'high';
    if (mediumImpactKeywords.some(keyword => text.includes(keyword))) return 'medium';
    if (lowImpactKeywords.some(keyword => text.includes(keyword))) return 'low';
    
    return 'unknown';
  }

  calculateConfidence(classification, article) {
    let confidence = 0.5; // Base confidence
    
    // Higher confidence for direct stock mentions
    if (classification.type.category === 'stock-specific') confidence += 0.3;
    
    // Higher confidence for recent news
    const hoursAgo = this.getHoursAgo(article.publishedAt);
    if (hoursAgo < 24) confidence += 0.1;
    
    // Higher confidence for detailed content
    if (article.content && article.content.length > 500) confidence += 0.1;
    
    return Math.min(0.95, confidence);
  }

  // Helper methods
  getCompanyName(stockSymbol) {
    const companyNames = {
      'AAPL': 'Apple',
      'TSLA': 'Tesla',
      'GOOGL': 'Google',
      'MSFT': 'Microsoft',
      'AMZN': 'Amazon'
      // Add more mappings as needed
    };
    return companyNames[stockSymbol] || stockSymbol;
  }

  getCompetitors(stockSymbol, sector) {
    const competitors = {
      'AAPL': ['Samsung', 'Google', 'Microsoft', 'GOOGL', 'MSFT'],
      'TSLA': ['Ford', 'GM', 'Volkswagen', 'BMW', 'F', 'GM'],
      'GOOGL': ['Apple', 'Microsoft', 'Facebook', 'AAPL', 'MSFT', 'META']
    };
    return competitors[stockSymbol] || [];
  }

  isIndustryRelevant(text, sector) {
    const sectorKeywords = {
      'Technology': ['tech', 'software', 'ai', 'cloud', 'digital'],
      'Healthcare': ['pharma', 'biotech', 'medical', 'drug', 'clinical'],
      'Financial': ['bank', 'finance', 'credit', 'loan', 'insurance']
    };
    
    const keywords = sectorKeywords[sector] || [];
    return keywords.some(keyword => text.includes(keyword));
  }

  getHoursAgo(publishedAt) {
    if (!publishedAt) return 168; // Default to 1 week ago
    const now = new Date();
    const published = new Date(publishedAt);
    return (now - published) / (1000 * 60 * 60); // Hours
  }

  async generateDailySummary(stockSymbol, stockData, newsArticles) {
    const priceChange = stockData.changePercent;
    const relevantNews = newsArticles.filter(article => article.relevanceScore > 0.3);
    
    const stockSpecificNews = relevantNews.filter(article => 
      article.classification?.type?.category === 'stock-specific'
    );
    
    const competitorNews = relevantNews.filter(article => 
      article.classification?.type?.category === 'competitor'
    );
    
    const industryNews = relevantNews.filter(article => 
      article.classification?.type?.category === 'industry'
    );
    
    const macroNews = relevantNews.filter(article => 
      article.classification?.type?.category === 'macro'
    );

    let summary = {
      symbol: stockSymbol,
      date: new Date().toISOString().split('T')[0],
      priceMovement: {
        direction: priceChange > 0 ? 'up' : priceChange < 0 ? 'down' : 'flat',
        magnitude: Math.abs(priceChange),
        significance: this.getMovementSignificance(Math.abs(priceChange))
      },
      newsAnalysis: {
        stockSpecific: stockSpecificNews.length,
        competitor: competitorNews.length,
        industry: industryNews.length,
        macro: macroNews.length,
        totalRelevant: relevantNews.length
      },
      movementExplanation: '',
      keyEvents: [],
      sentiment: this.calculateOverallSentiment(relevantNews)
    };

    // Generate movement explanation
    if (stockSpecificNews.length > 0) {
      summary.movementExplanation = `Primary driver: Company-specific news (${stockSpecificNews.length} articles)`;
      summary.keyEvents = stockSpecificNews.slice(0, 3).map(article => ({
        title: article.title,
        impact: article.classification?.priceImpact || 'unknown'
      }));
    } else if (competitorNews.length > 0) {
      summary.movementExplanation = `Likely driver: Competitor developments affecting sector`;
      summary.keyEvents = competitorNews.slice(0, 2).map(article => ({
        title: article.title,
        competitor: article.classification?.type?.affectedCompetitor
      }));
    } else if (industryNews.length > 0) {
      summary.movementExplanation = `Likely driver: Industry-wide developments`;
    } else if (macroNews.length > 0) {
      summary.movementExplanation = `Likely driver: Market-wide macro events`;
    } else if (Math.abs(priceChange) > 2) {
      summary.movementExplanation = `No specific news found - likely macro/market driven movement`;
    } else {
      summary.movementExplanation = `Normal trading activity with minimal news impact`;
    }

    return summary;
  }

  getMovementSignificance(changePercent) {
    if (changePercent > 5) return 'high';
    if (changePercent > 2) return 'medium';
    if (changePercent > 0.5) return 'low';
    return 'minimal';
  }

  calculateOverallSentiment(articles) {
    if (articles.length === 0) return 0;
    
    const totalSentiment = articles.reduce((sum, article) => 
      sum + (article.sentimentScore || 0), 0
    );
    
    return totalSentiment / articles.length;
  }
}

module.exports = NewsClassificationService;
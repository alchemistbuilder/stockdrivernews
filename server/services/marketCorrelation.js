const axios = require('axios');

class MarketCorrelationService {
  constructor() {
    this.marketIndices = ['SPY', 'QQQ', 'DIA', 'IWM']; // S&P 500, NASDAQ, Dow, Russell 2000
    this.sectorETFs = {
      'Technology': 'XLK',
      'Healthcare': 'XLV',
      'Financial': 'XLF',
      'Energy': 'XLE',
      'Consumer': 'XLY',
      'Utilities': 'XLU',
      'Materials': 'XLB',
      'Industrial': 'XLI',
      'Real Estate': 'XLRE',
      'Communication': 'XLC'
    };

    this.macroEvents = {
      'fed_meeting': { impact: 'high', keywords: ['federal reserve', 'fed meeting', 'interest rate'] },
      'earnings_season': { impact: 'medium', keywords: ['earnings season', 'quarterly results'] },
      'economic_data': { impact: 'medium', keywords: ['gdp', 'inflation', 'employment', 'cpi', 'ppi'] },
      'geopolitical': { impact: 'high', keywords: ['war', 'conflict', 'sanctions', 'election'] },
      'market_structure': { impact: 'medium', keywords: ['options expiration', 'rebalancing', 'triple witching'] }
    };
  }

  async analyzeStockMovement(stockSymbol, stockData, newsArticles, timeframe = '1d') {
    const analysis = {
      symbol: stockSymbol,
      priceChange: stockData.changePercent,
      volume: stockData.volume,
      correlations: {},
      explanation: '',
      confidence: 0,
      factors: []
    };

    // Get market data for comparison
    const marketData = await this.getMarketData(timeframe);
    const sectorData = await this.getSectorData(stockData.sector, timeframe);
    
    // Calculate correlations
    analysis.correlations = {
      market: this.calculateMarketCorrelation(stockData.changePercent, marketData),
      sector: this.calculateSectorCorrelation(stockData.changePercent, sectorData, stockData.sector),
      volume: this.analyzeVolumePattern(stockData.volume, stockData.avgVolume)
    };

    // Analyze news relevance
    const newsAnalysis = this.analyzeNewsRelevance(newsArticles, stockSymbol);
    
    // Determine primary movement driver
    const movementDriver = this.determineMovementDriver(
      analysis.correlations,
      newsAnalysis,
      Math.abs(stockData.changePercent)
    );

    analysis.explanation = this.generateExplanation(movementDriver, analysis.correlations, newsAnalysis);
    analysis.factors = this.identifyContributingFactors(movementDriver, analysis.correlations, newsAnalysis);
    analysis.confidence = this.calculateConfidence(movementDriver, analysis.correlations, newsAnalysis);

    return analysis;
  }

  async getMarketData(timeframe) {
    // Simulate market data - replace with real API calls
    return {
      SPY: { change: -0.5, volume: 85000000 },
      QQQ: { change: -1.2, volume: 45000000 },
      DIA: { change: -0.3, volume: 15000000 },
      IWM: { change: -0.8, volume: 25000000 }
    };
  }

  async getSectorData(sector, timeframe) {
    const sectorETF = this.sectorETFs[sector];
    if (!sectorETF) return null;

    // Simulate sector data - replace with real API calls
    return {
      symbol: sectorETF,
      change: -0.7,
      volume: 12000000
    };
  }

  calculateMarketCorrelation(stockChange, marketData) {
    const marketChanges = Object.values(marketData).map(data => data.change);
    const avgMarketChange = marketChanges.reduce((sum, change) => sum + change, 0) / marketChanges.length;
    
    // Simple correlation calculation
    const correlation = this.calculateCorrelationCoefficient(stockChange, avgMarketChange);
    
    return {
      coefficient: correlation,
      marketDirection: avgMarketChange > 0 ? 'up' : avgMarketChange < 0 ? 'down' : 'flat',
      marketMagnitude: Math.abs(avgMarketChange),
      alignment: this.getAlignment(stockChange, avgMarketChange),
      strength: this.getCorrelationStrength(correlation)
    };
  }

  calculateSectorCorrelation(stockChange, sectorData, sector) {
    if (!sectorData) return null;

    const correlation = this.calculateCorrelationCoefficient(stockChange, sectorData.change);
    
    return {
      sector: sector,
      sectorChange: sectorData.change,
      correlation: correlation,
      alignment: this.getAlignment(stockChange, sectorData.change),
      strength: this.getCorrelationStrength(correlation),
      outperformance: stockChange - sectorData.change
    };
  }

  analyzeVolumePattern(currentVolume, avgVolume) {
    const volumeRatio = currentVolume / avgVolume;
    
    return {
      ratio: volumeRatio,
      pattern: this.getVolumePattern(volumeRatio),
      significance: this.getVolumeSignificance(volumeRatio)
    };
  }

  analyzeNewsRelevance(newsArticles, stockSymbol) {
    const relevantNews = newsArticles.filter(article => article.relevanceScore > 0.3);
    
    const categories = {
      stockSpecific: relevantNews.filter(article => 
        article.classification?.type?.category === 'stock-specific'
      ),
      competitor: relevantNews.filter(article => 
        article.classification?.type?.category === 'competitor'
      ),
      industry: relevantNews.filter(article => 
        article.classification?.type?.category === 'industry'
      ),
      macro: relevantNews.filter(article => 
        article.classification?.type?.category === 'macro'
      )
    };

    const totalRelevant = relevantNews.length;
    const hasHighImpactNews = relevantNews.some(article => 
      article.classification?.priceImpact === 'high'
    );

    return {
      totalRelevant,
      hasHighImpactNews,
      categories,
      newsExplanationPower: this.calculateNewsExplanationPower(categories, totalRelevant)
    };
  }

  determineMovementDriver(correlations, newsAnalysis, priceChangeMagnitude) {
    const { market, sector, volume } = correlations;
    const { newsExplanationPower, hasHighImpactNews, totalRelevant } = newsAnalysis;

    // High impact stock-specific news dominates
    if (hasHighImpactNews && newsAnalysis.categories.stockSpecific.length > 0) {
      return {
        primary: 'stock-specific-news',
        confidence: 0.9,
        reasoning: 'High-impact company-specific news identified'
      };
    }

    // Strong stock-specific news explanation
    if (newsExplanationPower > 0.7 && newsAnalysis.categories.stockSpecific.length > 0) {
      return {
        primary: 'stock-specific-news',
        confidence: 0.8,
        reasoning: 'Multiple relevant company-specific news articles'
      };
    }

    // Competitor/industry driven
    if (newsExplanationPower > 0.5 && 
        (newsAnalysis.categories.competitor.length > 0 || newsAnalysis.categories.industry.length > 0)) {
      return {
        primary: 'industry-sector',
        confidence: 0.7,
        reasoning: 'Industry or competitor news likely driving movement'
      };
    }

    // Strong market correlation with minimal news
    if (market.strength === 'strong' && newsExplanationPower < 0.3) {
      return {
        primary: 'market-driven',
        confidence: 0.8,
        reasoning: 'Strong correlation with market movement, minimal specific news'
      };
    }

    // Sector correlation
    if (sector && sector.strength === 'strong' && newsExplanationPower < 0.4) {
      return {
        primary: 'sector-driven',
        confidence: 0.7,
        reasoning: `Strong correlation with ${sector.sector} sector movement`
      };
    }

    // High volume unusual activity
    if (volume.significance === 'high' && priceChangeMagnitude > 3) {
      return {
        primary: 'unusual-activity',
        confidence: 0.6,
        reasoning: 'Unusual volume suggests institutional activity or unknown catalyst'
      };
    }

    // Macro events
    if (newsAnalysis.categories.macro.length > 0 && market.strength !== 'weak') {
      return {
        primary: 'macro-events',
        confidence: 0.6,
        reasoning: 'Macro economic events affecting broader market'
      };
    }

    // Default to market/unexplained
    return {
      primary: 'unexplained-market',
      confidence: 0.4,
      reasoning: 'No clear catalyst identified - likely broad market forces'
    };
  }

  generateExplanation(driver, correlations, newsAnalysis) {
    const { primary, reasoning } = driver;
    const priceDirection = correlations.market.marketDirection;

    switch (primary) {
      case 'stock-specific-news':
        return `Movement primarily driven by company-specific news. ${newsAnalysis.categories.stockSpecific.length} relevant articles identified.`;
      
      case 'industry-sector':
        return `Movement likely driven by industry/sector developments. Check competitor and sector news for insights.`;
      
      case 'market-driven':
        return `Movement correlates strongly with broader market (${priceDirection}). No significant company-specific news identified.`;
      
      case 'sector-driven':
        return `Movement follows ${correlations.sector?.sector} sector trend. Sector-wide factors likely at play.`;
      
      case 'unusual-activity':
        return `Unusual trading volume detected. May indicate institutional activity or unreported catalyst.`;
      
      case 'macro-events':
        return `Movement likely related to macro economic events affecting the broader market.`;
      
      default:
        return `No clear catalyst identified. Movement may be due to general market sentiment, profit-taking, or unknown factors.`;
    }
  }

  identifyContributingFactors(driver, correlations, newsAnalysis) {
    const factors = [];

    // Market correlation factor
    if (correlations.market.strength !== 'weak') {
      factors.push({
        type: 'market-correlation',
        strength: correlations.market.strength,
        description: `${correlations.market.strength} correlation with market (${correlations.market.marketDirection})`
      });
    }

    // Sector correlation factor
    if (correlations.sector && correlations.sector.strength !== 'weak') {
      factors.push({
        type: 'sector-correlation',
        strength: correlations.sector.strength,
        description: `${correlations.sector.strength} correlation with ${correlations.sector.sector} sector`
      });
    }

    // Volume factor
    if (correlations.volume.significance !== 'normal') {
      factors.push({
        type: 'volume-pattern',
        strength: correlations.volume.significance,
        description: `${correlations.volume.pattern} trading volume (${correlations.volume.ratio.toFixed(1)}x average)`
      });
    }

    // News factors
    Object.entries(newsAnalysis.categories).forEach(([category, articles]) => {
      if (articles.length > 0) {
        factors.push({
          type: `news-${category}`,
          strength: articles.length > 2 ? 'high' : articles.length > 1 ? 'medium' : 'low',
          description: `${articles.length} ${category.replace(/([A-Z])/g, ' $1').toLowerCase()} news articles`
        });
      }
    });

    return factors;
  }

  calculateConfidence(driver, correlations, newsAnalysis) {
    let confidence = driver.confidence;

    // Boost confidence for strong correlations
    if (correlations.market.strength === 'strong') confidence += 0.1;
    if (correlations.sector && correlations.sector.strength === 'strong') confidence += 0.1;

    // Boost confidence for high news relevance
    if (newsAnalysis.newsExplanationPower > 0.8) confidence += 0.1;

    // Reduce confidence for conflicting signals
    if (correlations.market.alignment === 'opposite' && newsAnalysis.totalRelevant > 0) {
      confidence -= 0.2;
    }

    return Math.max(0.1, Math.min(0.95, confidence));
  }

  // Helper methods
  calculateCorrelationCoefficient(x, y) {
    // Simplified correlation - in practice, you'd use historical data
    const alignment = this.getAlignment(x, y);
    if (alignment === 'same') return 0.8;
    if (alignment === 'opposite') return -0.8;
    return 0.1;
  }

  getAlignment(change1, change2) {
    if ((change1 > 0 && change2 > 0) || (change1 < 0 && change2 < 0)) return 'same';
    if ((change1 > 0 && change2 < 0) || (change1 < 0 && change2 > 0)) return 'opposite';
    return 'neutral';
  }

  getCorrelationStrength(correlation) {
    const abs = Math.abs(correlation);
    if (abs > 0.7) return 'strong';
    if (abs > 0.3) return 'medium';
    return 'weak';
  }

  getVolumePattern(ratio) {
    if (ratio > 3) return 'extremely high';
    if (ratio > 2) return 'very high';
    if (ratio > 1.5) return 'high';
    if (ratio > 0.8) return 'normal';
    if (ratio > 0.5) return 'low';
    return 'very low';
  }

  getVolumeSignificance(ratio) {
    if (ratio > 2.5) return 'high';
    if (ratio > 1.5) return 'medium';
    if (ratio < 0.6) return 'low';
    return 'normal';
  }

  calculateNewsExplanationPower(categories, totalRelevant) {
    if (totalRelevant === 0) return 0;

    let power = 0;
    power += categories.stockSpecific.length * 0.4; // Stock-specific news has highest power
    power += categories.competitor.length * 0.25;
    power += categories.industry.length * 0.2;
    power += categories.macro.length * 0.15;

    return Math.min(1.0, power);
  }
}

module.exports = MarketCorrelationService;
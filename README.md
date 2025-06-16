# 📈 StockDriverNews

**Intelligent stock analysis platform that distinguishes true stock drivers from market noise**

## 🚀 Features

### ✨ Core Intelligence
- **Smart News Classification** - Distinguishes stock-specific vs macro/market-wide events
- **Movement Analysis** - Explains WHY stocks moved with confidence scoring
- **Competitor Read-Through** - Analyzes how rival company news affects your stocks
- **Priority Scoring** - Intelligent 1-10 scale ranking based on price movement + news impact

### 📊 Real-Time Data
- **Live Stock Prices** - Real-time market data integration
- **Breaking News** - Instant financial news aggregation from multiple sources
- **Daily Digest** - Comprehensive watchlist overview with priority alerts
- **Market Correlation** - Detects macro vs stock-specific movements

### 🏦 Hedge Fund Ready
- **Professional APIs** - Integrated with NewsAPI, Alpha Vantage, Twelve Data
- **Scalable Architecture** - React frontend + Node.js backend
- **Enterprise Features** - Ready for Bloomberg/Reuters integration

## 🏗️ Architecture

```
├── client/          # React TypeScript frontend
├── server/          # Node.js Express backend
├── docs/           # Setup guides and documentation
└── README.md
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
# Backend
cd server && npm install

# Frontend  
cd client && npm install
```

### 2. Configure APIs
```bash
# Add to server/.env:
NEWS_API_KEY=your_newsapi_key
ALPHA_VANTAGE_API_KEY=your_alphavantage_key
```

### 3. Start Development
```bash
# Backend: http://localhost:3001
cd server && npm run dev

# Frontend: http://localhost:3000
cd client && npm start
```

## 📱 Live Demo Features

- **Dashboard** - Market overview with trending stocks
- **Stock Detail** - Individual analysis with WHY explanations
- **Daily Digest** - Priority-ranked watchlist with intelligent alerts
- **News Classification** - Real-time categorization of market events

## 🔧 API Integrations

- **NewsAPI** - Real-time financial news aggregation
- **Alpha Vantage** - Enhanced stock fundamentals  
- **Twelve Data** - Live stock price feeds
- **Smart Fallbacks** - Multiple data sources for reliability

## 💰 Scaling Path

- **Current**: Free APIs (NewsAPI, Alpha Vantage) - $0/month
- **Professional**: Premium APIs (IEX Cloud Pro, Benzinga) - $800/month
- **Enterprise**: Institutional data (Bloomberg, Reuters) - $5,000+/month

## 🏆 Key Differentiators

1. **Intelligent Classification** - Not just news aggregation, but smart categorization
2. **Movement Explanations** - Answers "WHY did my stock move?"
3. **Competitor Analysis** - Cross-stock impact detection
4. **Priority Intelligence** - Focus on what matters most
5. **Hedge Fund Architecture** - Built for professional scaling

---

**🎯 Built to distinguish true stock drivers from market noise**
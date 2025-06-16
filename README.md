# 📈 Stock News Aggregator

A comprehensive stock news aggregator that provides intelligent news classification, insider trading tracking, and institutional holdings analysis for informed investment decisions.

## 🚀 Features

### Core Functionality
- **🔍 Stock Search & Watchlist**: Add stocks to your personal watchlist and get real-time updates
- **📰 Intelligent News Aggregation**: Automated categorization of news as stock-specific, competitor-related, industry-wide, or macro-economic
- **👥 Insider Trading Tracking**: Monitor director and officer buy/sell transactions with sentiment analysis
- **🏦 Institutional Holdings**: Track 13F filings and hedge fund position changes
- **📊 Interactive Charts**: Multiple timeframe price charts (1D, 5D, 1M, YTD, 1Y, 5Y)
- **🎯 Competitor Analysis**: Cross-stock impact analysis and competitive read-throughs

### Smart Classification System
- **Stock-Specific**: Earnings, product launches, management changes
- **Competitor Impact**: How related companies' news affects your stocks
- **Industry/Regulatory**: Sector-wide developments and regulatory changes
- **Macro Events**: Fed decisions, economic indicators, geopolitical events

### Data Sources Integration
- **News APIs**: Multi-source news aggregation with relevance scoring
- **SEC Filings**: Real-time insider trading and institutional holdings data
- **Stock Data**: Real-time price feeds and historical data
- **13F Filings**: Quarterly institutional holdings analysis

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **React Router** for navigation
- **Recharts** for data visualization
- **Responsive CSS** with mobile-first design

### Backend
- **Node.js** with Express
- **PostgreSQL** for structured data storage
- **RESTful API** architecture
- **JWT Authentication**
- **Rate limiting** and security headers

### APIs & Data Sources
- News APIs (NewsAPI, Alpha Vantage, Polygon.io)
- SEC EDGAR API for filings
- Stock price feeds (Yahoo Finance, IEX Cloud)
- Institutional data (WhaleWisdom, Fintel)

## 🏗️ Project Structure

```
stock-news-aggregator/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Route components
│   │   ├── services/      # API services
│   │   └── types/         # TypeScript definitions
├── server/                # Node.js backend
│   ├── routes/           # API endpoints
│   ├── models/           # Data models
│   ├── services/         # Business logic
│   └── utils/            # Helper functions
└── database/             # Database schema and migrations
```

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm
- PostgreSQL 12+
- API keys for data sources (see configuration section)

### Installation

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd stock-news-aggregator
npm run install:all
```

2. **Database setup:**
```bash
# Create PostgreSQL database
createdb stock_news_db

# Run schema setup
psql -d stock_news_db -f database/schema.sql
```

3. **Environment configuration:**
```bash
# Copy example environment file
cp server/.env.example server/.env

# Edit server/.env with your configuration
```

4. **Start the application:**
```bash
# Development mode (runs both frontend and backend)
npm run dev

# Or start services separately:
npm run server:dev  # Backend on port 3001
npm run client:dev  # Frontend on port 3000
```

## ⚙️ Configuration

### Required API Keys

Add these to your `server/.env` file:

```env
# News aggregation
NEWS_API_KEY=your_news_api_key
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
POLYGON_API_KEY=your_polygon_key
IEX_CLOUD_API_KEY=your_iex_cloud_key
FINNHUB_API_KEY=your_finnhub_key

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=stock_news_db
DB_USER=your_db_username
DB_PASSWORD=your_db_password

# Security
JWT_SECRET=your_jwt_secret_key
```

### API Key Sources
- **NewsAPI**: https://newsapi.org/
- **Alpha Vantage**: https://www.alphavantage.co/
- **Polygon.io**: https://polygon.io/
- **IEX Cloud**: https://iexcloud.io/
- **Finnhub**: https://finnhub.io/

## 📊 API Endpoints

### Stocks
- `GET /api/stocks` - Search stocks
- `GET /api/stocks/:symbol` - Get stock details
- `GET /api/stocks/:symbol/price-history` - Price history
- `POST /api/stocks/:symbol/watchlist` - Add to watchlist

### News
- `GET /api/news/:symbol` - Get stock news
- `GET /api/news/:symbol/today` - Today's news
- `GET /api/news/:symbol/competitor-impact` - Competitor analysis
- `POST /api/news/classify` - Classify news article

### Insider Trading
- `GET /api/insider/:symbol` - Insider trading data
- `GET /api/insider/:symbol/recent` - Recent activity
- `GET /api/insider/:symbol/competitors` - Competitor insider activity

### Institutional Holdings
- `GET /api/institutional/:symbol` - Institutional holdings
- `GET /api/institutional/:symbol/changes` - Holdings changes
- `GET /api/institutional/:symbol/13f-highlights` - Notable 13F moves

## 🎯 Usage Examples

### Search and Add Stocks
1. Use the search bar to find stocks by symbol (e.g., \"AAPL\", \"TSLA\")
2. Click on a stock to view its detailed page
3. Add stocks to your watchlist for monitoring

### Monitor News Impact
- View categorized news for each stock
- Filter by news type (stock-specific, competitor, industry, macro)
- Track sentiment scores and relevance ratings

### Track Insider Activity
- Monitor director and officer transactions
- Analyze buying vs. selling patterns
- Get alerts for significant insider moves

### Institutional Analysis
- Track quarterly 13F filings
- Monitor new positions and position changes
- Identify trending institutional moves

## 🔮 Roadmap

### Phase 1: Enhanced Data Integration
- [ ] Real-time news classification ML model
- [ ] Advanced sentiment analysis
- [ ] Competitor relationship mapping
- [ ] Historical backtesting

### Phase 2: Advanced Features
- [ ] Price alerts and notifications
- [ ] Portfolio tracking integration
- [ ] Social sentiment analysis
- [ ] Options flow tracking

### Phase 3: Analytics & Insights
- [ ] Predictive analytics
- [ ] Risk assessment tools
- [ ] Performance attribution
- [ ] Custom dashboards

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Financial data providers for API access
- SEC for public filing data
- Open source community for tools and libraries
- Contributors and beta testers

---

**⚠️ Disclaimer**: This tool is for informational purposes only and should not be considered as financial advice. Always do your own research and consult with financial professionals before making investment decisions.
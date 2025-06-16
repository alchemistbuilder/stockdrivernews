# 🔑 API Keys Setup Guide

Your Stock News Aggregator is now ready for live data integration! Follow this guide to set up API keys and start getting real-time data.

## 🚀 **Current Status**

✅ **Intelligent News Classification** - Fully implemented  
✅ **Market Correlation Analysis** - Fully implemented  
✅ **Yahoo Finance Integration** - Working (no key required)  
⚠️ **NewsAPI** - Requires API key  
⚠️ **Alpha Vantage** - Requires API key  

## 🔧 **API Keys Required**

### 1. NewsAPI (News Aggregation)
- **Website**: https://newsapi.org/
- **Free Tier**: 1,000 requests/day
- **Cost**: Free for development
- **Setup**:
  1. Sign up at https://newsapi.org/register
  2. Get your API key from the dashboard
  3. Add to `.env`: `NEWS_API_KEY=your_key_here`

### 2. Alpha Vantage (Financial Data + News)
- **Website**: https://www.alphavantage.co/
- **Free Tier**: 5 API requests per minute, 500 per day
- **Cost**: Free for development
- **Setup**:
  1. Sign up at https://www.alphavantage.co/support/#api-key
  2. Get your free API key
  3. Add to `.env`: `ALPHA_VANTAGE_API_KEY=your_key_here`

### 3. Yahoo Finance (Already Working!)
- **Status**: ✅ Already integrated
- **Cost**: Free (no API key required)
- **Provides**: Real-time stock prices, historical data, company info

## 📋 **Quick Setup Steps**

1. **Get API Keys** (5 minutes each):
   ```bash
   # NewsAPI
   curl -H "X-Api-Key: YOUR_KEY" "https://newsapi.org/v2/everything?q=apple&pageSize=1"
   
   # Alpha Vantage
   curl "https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=YOUR_KEY"
   ```

2. **Update Environment File**:
   ```bash
   cd "/Users/andytran/Dropbox/code/claudecode/News Alert for Stocks/server"
   
   # Edit .env file
   NEWS_API_KEY=your_newsapi_key_here
   ALPHA_VANTAGE_API_KEY=your_alphavantage_key_here
   ```

3. **Test the Integration**:
   ```bash
   # Test stock data (works now with Yahoo Finance)
   curl "http://localhost:3001/api/stocks/AAPL"
   
   # Test news (will work after adding API keys)
   curl "http://localhost:3001/api/news/AAPL"
   
   # Test daily summary
   curl "http://localhost:3001/api/news/AAPL/daily-summary"
   ```

## 🧪 **Testing Real Data**

Once you have API keys, test these endpoints:

### **Stock Data** (Working Now)
```bash
# Get real Apple stock data
curl "http://localhost:3001/api/stocks/AAPL" | jq .

# Get historical data
curl "http://localhost:3001/api/stocks/AAPL/price-history?timeframe=1mo" | jq .

# Search stocks
curl "http://localhost:3001/api/stocks?search=apple" | jq .
```

### **News Analysis** (After API Keys)
```bash
# Get classified news for Apple
curl "http://localhost:3001/api/news/AAPL" | jq .

# Get comprehensive daily summary
curl "http://localhost:3001/api/news/AAPL/daily-summary" | jq .

# Get today's news only
curl "http://localhost:3001/api/news/AAPL/today" | jq .
```

### **Market Overview**
```bash
# Get market indices and trending stocks
curl "http://localhost:3001/api/market/overview" | jq .

# Get trending stocks
curl "http://localhost:3001/api/market/trending" | jq .

# Check API health
curl "http://localhost:3001/api/market/health" | jq .
```

## 🎯 **What Works Right Now**

**Without API Keys**:
- ✅ Real-time stock prices (Yahoo Finance)
- ✅ Historical price data
- ✅ Stock search
- ✅ Company information
- ✅ Market indices data
- ✅ Intelligent classification engine
- ✅ Market correlation analysis

**After Adding API Keys**:
- 🔥 Real-time news aggregation
- 🔥 Multi-source news classification
- 🔥 Comprehensive daily summaries
- 🔥 Sentiment analysis
- 🔥 Company-specific vs macro news detection

## 🚨 **Rate Limiting Built-in**

The system includes smart rate limiting:
- **NewsAPI**: 1 second between requests
- **Alpha Vantage**: 12 seconds between requests (free tier)
- **Yahoo Finance**: 500ms between requests
- **Automatic caching**: 5-minute cache for most data

## 🔍 **Fallback Strategy**

The system gracefully handles missing API keys:
1. **Yahoo Finance** provides stock data (always works)
2. **NewsAPI** provides recent news (with key)
3. **Alpha Vantage** provides backup stock data + news (with key)
4. **Classification engine** works with any news source

## 🚀 **Next Steps**

1. **Get API keys** (5-10 minutes total)
2. **Test real data flows**
3. **Explore the intelligent summaries**
4. **See stock-specific vs macro classification in action**

The system is production-ready and will provide incredibly valuable insights once connected to live news feeds!

---

**💡 Pro Tip**: Start with just NewsAPI to see the intelligent classification in action, then add Alpha Vantage for enhanced coverage.
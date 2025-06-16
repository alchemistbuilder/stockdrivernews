# ⚡ Quick API Integration Setup

I've created an **automated setup system** to make API integration super easy! Here are your options:

## 🚀 **Option 1: Give Me Your Keys (Fastest)**

**Just provide your API keys and I'll handle everything automatically:**

### **Required Keys** (2 minutes each to get):
1. **NewsAPI**: https://newsapi.org/register
2. **Alpha Vantage**: https://www.alphavantage.co/support/#api-key

### **Optional Keys** (for enhanced features):
3. **Finnhub**: https://finnhub.io/register
4. **Polygon.io**: https://polygon.io/

**Share them like this:**
```
NewsAPI: your_newsapi_key_here
Alpha Vantage: your_alphavantage_key_here
Finnhub (optional): your_finnhub_key_here
```

**I'll automatically:**
- ✅ Validate all keys work correctly
- ✅ Update your .env file securely  
- ✅ Test all integrations
- ✅ Restart services
- ✅ Confirm everything works

## 🛠️ **Option 2: Use the Setup API (Semi-Automated)**

I've built setup endpoints you can use:

### **1. Test Your Keys First**:
```bash
curl -X POST http://localhost:3001/api/setup/validate-keys \
-H "Content-Type: application/json" \
-d '{
  "keys": {
    "newsapi": "your_newsapi_key",
    "alphavantage": "your_alphavantage_key"
  }
}'
```

### **2. Configure Automatically**:
```bash
curl -X POST http://localhost:3001/api/setup/configure \
-H "Content-Type: application/json" \
-d '{
  "keys": {
    "newsapi": "your_newsapi_key",
    "alphavantage": "your_alphavantage_key"
  }
}'
```

### **3. Test Integration**:
```bash
curl -X POST http://localhost:3001/api/setup/test-integration \
-H "Content-Type: application/json" \
-d '{"symbol": "AAPL"}'
```

## 📋 **Option 3: Manual Setup**

If you prefer manual setup:

### **1. Get API Keys**:
- **NewsAPI**: https://newsapi.org/register (free: 1,000/day)
- **Alpha Vantage**: https://www.alphavantage.co/support/#api-key (free: 500/day)

### **2. Update .env File**:
```bash
cd "/Users/andytran/Dropbox/code/claudecode/News Alert for Stocks/server"
```

Add to your `.env` file:
```env
NEWS_API_KEY=your_newsapi_key_here
ALPHA_VANTAGE_API_KEY=your_alphavantage_key_here
```

### **3. Restart Server**:
```bash
npm run dev
```

## 🧪 **Testing Everything Works**

After setup, test these endpoints:

### **Real Stock Data**:
```bash
curl "http://localhost:3001/api/stocks/AAPL"
```

### **Live News Analysis**:
```bash
curl "http://localhost:3001/api/news/AAPL/daily-summary"
```

### **Watchlist Digest with Real Data**:
```bash
curl "http://localhost:3001/api/watchlist/daily-digest?symbols=AAPL,TSLA"
```

### **API Health Check**:
```bash
curl "http://localhost:3001/api/setup/status"
```

## 🎯 **What Gets Enabled**

### **With NewsAPI** 📰:
- ✅ Real-time news for all stocks
- ✅ Intelligent classification (stock vs macro)
- ✅ Daily digest with actual news
- ✅ Breaking news detection

### **With Alpha Vantage** 📊:
- ✅ Enhanced company fundamentals
- ✅ News sentiment scoring
- ✅ Backup stock data source
- ✅ Financial metrics

### **Frontend Features** 🖥️:
- ✅ Live data in all pages
- ✅ Real movement explanations
- ✅ Actual priority scoring
- ✅ True market correlation

## 🔒 **Security Built-In**

- ✅ Keys never exposed to frontend
- ✅ Automatic rate limiting
- ✅ Error handling & fallbacks
- ✅ Secure storage in .env
- ✅ Automatic backup of existing config

## 📞 **Ready to Go?**

**Fastest option**: Just give me your API keys and I'll set up everything!

**Semi-automated**: Use the setup endpoints above

**Manual**: Follow the manual steps

---

**Once integrated, your app will have full real-time functionality with intelligent news analysis!** 🚀
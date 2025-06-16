-- Stock News Aggregator Database Schema

-- Users table for authentication
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stocks table
CREATE TABLE stocks (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    sector VARCHAR(100),
    industry VARCHAR(100),
    market_cap BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User watchlists
CREATE TABLE watchlists (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    stock_id INTEGER REFERENCES stocks(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, stock_id)
);

-- Stock prices (daily)
CREATE TABLE stock_prices (
    id SERIAL PRIMARY KEY,
    stock_id INTEGER REFERENCES stocks(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    open_price DECIMAL(10,2),
    high_price DECIMAL(10,2),
    low_price DECIMAL(10,2),
    close_price DECIMAL(10,2),
    volume BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(stock_id, date)
);

-- News articles
CREATE TABLE news_articles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    content TEXT,
    url VARCHAR(1000) UNIQUE,
    source VARCHAR(100),
    published_at TIMESTAMP,
    sentiment_score DECIMAL(3,2), -- -1.00 to 1.00
    relevance_score DECIMAL(3,2), -- 0.00 to 1.00
    classification VARCHAR(50), -- 'stock-specific', 'competitor', 'industry', 'macro'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Many-to-many relationship between news and stocks
CREATE TABLE news_stocks (
    id SERIAL PRIMARY KEY,
    news_id INTEGER REFERENCES news_articles(id) ON DELETE CASCADE,
    stock_id INTEGER REFERENCES stocks(id) ON DELETE CASCADE,
    relevance_type VARCHAR(50), -- 'primary', 'competitor', 'industry'
    impact_score DECIMAL(3,2), -- 0.00 to 1.00
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(news_id, stock_id)
);

-- Insider trading data
CREATE TABLE insider_trades (
    id SERIAL PRIMARY KEY,
    stock_id INTEGER REFERENCES stocks(id) ON DELETE CASCADE,
    insider_name VARCHAR(255),
    insider_title VARCHAR(255),
    transaction_type VARCHAR(50), -- 'buy', 'sell', 'option_exercise'
    shares_traded INTEGER,
    price_per_share DECIMAL(10,2),
    total_value DECIMAL(15,2),
    shares_owned_after INTEGER,
    filing_date DATE,
    transaction_date DATE,
    form_type VARCHAR(10), -- 'Form 4', 'Form 5'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Institutional holdings (13F data)
CREATE TABLE institutional_holdings (
    id SERIAL PRIMARY KEY,
    stock_id INTEGER REFERENCES stocks(id) ON DELETE CASCADE,
    institution_name VARCHAR(255),
    institution_cik VARCHAR(20),
    shares_held BIGINT,
    market_value BIGINT,
    percent_of_portfolio DECIMAL(5,2),
    quarter VARCHAR(7), -- 'YYYY-QX' format
    filing_date DATE,
    change_in_shares BIGINT, -- vs previous quarter
    change_type VARCHAR(50), -- 'new_position', 'increased', 'decreased', 'sold_out'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(stock_id, institution_cik, quarter)
);

-- Competitor relationships
CREATE TABLE competitor_relationships (
    id SERIAL PRIMARY KEY,
    stock_id INTEGER REFERENCES stocks(id) ON DELETE CASCADE,
    competitor_id INTEGER REFERENCES stocks(id) ON DELETE CASCADE,
    relationship_strength DECIMAL(3,2), -- 0.00 to 1.00
    sector_overlap BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(stock_id, competitor_id)
);

-- Stock price alerts
CREATE TABLE price_alerts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    stock_id INTEGER REFERENCES stocks(id) ON DELETE CASCADE,
    alert_type VARCHAR(50), -- 'price_above', 'price_below', 'volume_spike', 'news_alert'
    threshold_value DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_stocks_symbol ON stocks(symbol);
CREATE INDEX idx_stock_prices_stock_date ON stock_prices(stock_id, date DESC);
CREATE INDEX idx_news_published ON news_articles(published_at DESC);
CREATE INDEX idx_news_stocks_stock ON news_stocks(stock_id);
CREATE INDEX idx_insider_trades_stock_date ON insider_trades(stock_id, transaction_date DESC);
CREATE INDEX idx_institutional_holdings_stock_quarter ON institutional_holdings(stock_id, quarter);
CREATE INDEX idx_watchlists_user ON watchlists(user_id);
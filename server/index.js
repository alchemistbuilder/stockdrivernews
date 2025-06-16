const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const stocksRouter = require('./routes/stocks');
const newsRouter = require('./routes/news');
const insiderRouter = require('./routes/insider');
const institutionalRouter = require('./routes/institutional');
const marketRouter = require('./routes/market');
const watchlistRouter = require('./routes/watchlist');
const setupRouter = require('./routes/setup');

app.use('/api/stocks', stocksRouter);
app.use('/api/news', newsRouter);
app.use('/api/insider', insiderRouter);
app.use('/api/institutional', institutionalRouter);
app.use('/api/market', marketRouter);
app.use('/api/watchlist', watchlistRouter);
app.use('/api/setup', setupRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const chatRoutes = require('./routes/chat.routes');
const moodRoutes = require('./routes/mood.routes');
const userRoutes = require('./routes/user.routes');
const mlRoutes   = require('./routes/ml.routes');

const { errorHandler } = require('./middleware/error.middleware');

const app = express();

// ── TRUST PROXY (fixes X-Forwarded-For rate-limit warning) ──────────────────
app.set('trust proxy', 1);

// ── Security middleware ──────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','PATCH'],
  allowedHeaders: ['Content-Type','Authorization'],
}));

// ── Rate limiting ────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({ windowMs: 15*60*1000, max: 200, message: 'Too many requests', standardHeaders: true, legacyHeaders: false });
const authLimiter   = rateLimit({ windowMs: 15*60*1000, max: 20,  message: 'Too many auth attempts', standardHeaders: true, legacyHeaders: false });
const chatLimiter   = rateLimit({ windowMs:  1*60*1000, max: 30,  message: 'Slow down chat requests', standardHeaders: true, legacyHeaders: false });
app.use(globalLimiter);

// ── General middleware ───────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// ── Database ──────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => { console.error('❌ MongoDB error:', err); process.exit(1); });

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/chat', chatLimiter, chatRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api/user', userRoutes);
app.use('/api/ml',   mlRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// ── Error handler ─────────────────────────────────────────────────────────────
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

module.exports = app;


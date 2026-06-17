require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/AppError');

// Routes (to be added per feature)
const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');

const app = express();

// ─── Connect Database ────────────────────────────────────────────
connectDB();

// ─── Security Middleware ─────────────────────────────────────────
app.use(helmet());                        // Sets secure HTTP headers
app.use(mongoSanitize());                 // Strips $ and . from req.body to prevent NoSQL injection

// ─── Rate Limiting ───────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,              // 15 minutes
  max: 100,                              // Max 100 requests per IP per window
  message: { status: 'fail', message: 'Too many requests. Please try again later.' },
});
app.use('/api', limiter);

// ─── General Middleware ──────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10kb' })); // Body parser (max 10kb to prevent large payloads)
app.use(morgan('dev'));                   // HTTP request logger

// ─── Routes ─────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV }));

// ─── 404 Handler ────────────────────────────────────────────────
app.all('*', (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

// ─── Global Error Handler ────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

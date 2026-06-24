require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const hpp = require('hpp');

const connectDB = require('./config/db');
const passport  = require('./config/passport');
const errorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/AppError');

const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');

const app = express();

// Trust Render's proxy — required for rate-limit and IP detection on cloud platforms
app.set('trust proxy', 1);

//  Connect Database 
connectDB();

//  Security Headers 
app.use(helmet());

//  CORS 
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',');
app.use(
  cors({
    origin: (origin, cb) => {
      // Allow requests with no origin (e.g. Postman, curl)
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

//  Compression 
// Gzip responses > 1kb — cuts payload size by ~70%
app.use(compression());

//  Body Parser 
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

//  Data Sanitization 
app.use(mongoSanitize());
app.use(hpp());

//  Passport 
app.use(passport.initialize());

//  Rate Limiting 
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'fail', message: 'Too many requests. Please try again later.' },
});

// Stricter limiter for auth endpoints to prevent brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'fail', message: 'Too many auth attempts. Please try again in 15 minutes.' },
});

app.use('/api', globalLimiter);
app.use('/api/auth', authLimiter);

//  Logging 
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

//  Routes 
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);

//  Health Check 
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    env: process.env.NODE_ENV,
    uptime: `${Math.floor(process.uptime())}s`,
    timestamp: new Date().toISOString(),
  });
});

//  404 Handler 
app.all('*', (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

//  Global Error Handler 
app.use(errorHandler);

//  Start Server 
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

//  Graceful Shutdown 
// Catches SIGTERM (from process manager like PM2/Docker) and SIGINT (Ctrl+C)
const shutdown = (signal) => {
  console.log(`\n⚠️  ${signal} received. Closing server gracefully...`);
  server.close(() => {
    console.log('✅ HTTP server closed.');
    process.exit(0);
  });
  // Force exit if server hasn't closed in 10s
  setTimeout(() => process.exit(1), 10000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

// Catch unhandled promise rejections (e.g. DB connection drop after start)
process.on('unhandledRejection', (err) => {
  console.error('💥 Unhandled Rejection:', err.message);
  shutdown('unhandledRejection');
});

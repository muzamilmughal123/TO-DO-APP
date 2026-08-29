const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const adminRoutes = require('./routes/adminRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();

// CORS must be registered before helmet and all routes so that preflight
// responses carry Access-Control-* headers.  The cors() middleware already
// handles OPTIONS when placed in app.use(), but Express 5 does not support
// wildcard strings in app.options(), so we add an explicit middleware to
// short-circuit every OPTIONS preflight with a 204 immediately after cors().
app.use(
  cors({
    // origin: true reflects the request origin back, which satisfies both:
    //   - same-origin Vercel requests (frontend + API on same domain)
    //   - credentialed cross-origin requests (credentials: true requires a
    //     specific origin, not the '*' wildcard — browsers reject the combo)
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
  })
);

// Explicit preflight handler — required in Express 5 because wildcard
// app.options('*') is not supported.
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Security headers (after CORS so helmet does not strip CORS headers).
app.use(helmet());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});
app.use('/api', limiter);

// Route Declarations
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'AI-Powered Smart Task Manager API is running...',
  });
});

app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Resource not found',
  });
});

app.use((err, req, res, next) => {
  console.error('Express global error:', err);
  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

module.exports = app;

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('../routes/auth');
const diagnosisRoutes = require('../routes/diagnosis');
const userRoutes = require('../routes/users');
const adminRoutes = require('../routes/admin');
const notificationRoutes = require('../routes/notifications');

const db = require('../database/db');
const config = require('../config');

const app = express();

app.use(helmet({
  contentSecurityPolicy: false,
}));

app.use(cors({
  origin: config.corsOrigin || '*',
  credentials: true
}));

const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

let dbInitialized = false;

const initializeDatabase = async () => {
  if (!dbInitialized) {
    try {
      await db.initialize();
      dbInitialized = true;
    } catch (error) {
      console.error('Database initialization error:', error);
    }
  }
};

app.use(async (req, res, next) => {
  if (!dbInitialized) {
    await initializeDatabase();
  }
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/diagnosis', diagnosisRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: dbInitialized ? 'connected' : 'disconnected'
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Medical Diagnosis API',
    status: 'running',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      diagnosis: '/api/diagnosis',
      users: '/api/users',
      admin: '/api/admin'
    }
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    message: 'Route not found',
    path: req.originalUrl
  });
});

module.exports = app;

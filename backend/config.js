module.exports = {
  port: process.env.PORT || 5000,
  jwtSecret: process.env.JWT_SECRET || 'your_super_secure_jwt_secret_key_change_in_production',
  nodeEnv: process.env.NODE_ENV || 'development',
  dbPath: process.env.DB_PATH || './database.sqlite',
  
  // Rate limiting
  rateLimitWindowMs: 15 * 60 * 1000, // 15 minutes
  rateLimitMax: 100, // requests per window
  
  // File upload limits
  maxFileSize: 10 * 1024 * 1024, // 10MB
  
  // CORS settings
  corsOrigin: process.env.NODE_ENV === 'production' ? false : 'http://localhost:3000',
  
  // Database settings
  database: {
    maxConnections: 10,
    acquireConnectionTimeout: 60000,
    timeout: 5000
  },
  
  // AI Model settings
  aiModel: {
    confidenceThreshold: 0.1,
    maxPredictions: 5,
    enableExplanations: true
  }
};

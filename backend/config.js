module.exports = {
  port: process.env.PORT || 5000,
  jwtSecret: process.env.JWT_SECRET || 'your_super_secure_jwt_secret_key_change_in_production',
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/medical-diagnosis',

  rateLimitWindowMs: 15 * 60 * 1000,
  rateLimitMax: 100,

  maxFileSize: 10 * 1024 * 1024,

  corsOrigin: process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? false : ['http://localhost:5173', 'http://localhost:5174']),

  email: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM || 'MediDiagnose <no-reply@medidiagnose.local>'
  },

  database: {
    maxConnections: 10,
    acquireConnectionTimeout: 60000,
    timeout: 5000
  },

  aiModel: {
    confidenceThreshold: 0.1,
    maxPredictions: 5,
    enableExplanations: true,
    pythonPath: process.env.PYTHON_PATH || 'python',
    modelTimeout: 60000
  }
};

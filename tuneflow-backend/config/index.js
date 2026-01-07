require('dotenv').config();

module.exports = {
  // Server configuration
  server: {
    port: process.env.PORT || 3001,
    host: process.env.HOST || 'localhost',
    env: process.env.NODE_ENV || 'development'
  },

  // CORS configuration
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['chrome-extension://*'],
    credentials: true
  },

  // Spotify API configuration
  spotify: {
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:3000/callback',
    scopes: [
      'playlist-read-private',
      'playlist-modify-private',
      'playlist-modify-public',
      'user-read-private',
      'user-read-email'
    ]
  },

  // Audio processing configuration
  audio: {
    formats: ['mp3', 'flac'],
    qualities: ['192', '320'],
    maxConcurrentJobs: parseInt(process.env.MAX_CONCURRENT_JOBS) || 3,
    jobTimeout: parseInt(process.env.JOB_TIMEOUT) || 300000,
    outputDir: process.env.OUTPUT_DIR || './downloads'
  },

  // Queue configuration
  queue: {
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    maxAttempts: 3,
    backoffDelay: 2000,
    removeOnComplete: 10,
    removeOnFail: 5
  },

  // Database configuration
  database: {
    path: './jobs.db'
  },

  // File management
  files: {
    maxSize: process.env.MAX_FILE_SIZE || '100MB',
    cleanupInterval: parseInt(process.env.CLEANUP_INTERVAL) || 86400000
  },

  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 900000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/tuneflow.log'
  },

  // High-resolution sources (future integration)
  hiressources: {
    lucida: {
      apiKey: process.env.LUCIDA_API_KEY,
      baseUrl: 'https://api.lucida.com'
    },
    deezer: {
      apiKey: process.env.DEEZER_API_KEY,
      baseUrl: 'https://api.deezer.com'
    },
    tidal: {
      apiKey: process.env.TIDAL_API_KEY,
      baseUrl: 'https://api.tidal.com'
    },
    qobuz: {
      apiKey: process.env.QOBUZ_API_KEY,
      baseUrl: 'https://api.qobuz.com'
    }
  },

  // Security
  security: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    encryptionKey: process.env.ENCRYPTION_KEY || 'your-encryption-key'
  }
};
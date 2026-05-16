// Centralized configuration for logging
module.exports = {
  levels: {
    INFO: 'INFO',
    WARN: 'WARN',
    ERROR: 'ERROR',
    DEBUG: 'DEBUG',
  },
  currentEnv: process.env.NODE_ENV || 'development',
};

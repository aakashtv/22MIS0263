const config = require('./config');

/**
 * Reusable async logger function
 * 
 * @param {string} stack - Optional stack trace or context identifier
 * @param {string} level - Log level (INFO, WARN, ERROR, DEBUG)
 * @param {string} packageName - The name of the service/package invoking the log
 * @param {string|object} message - The actual log message or object payload
 */
const Log = async (stack = '', level = config.levels.INFO, packageName = 'system', message = '') => {
  try {
    const validLevel = Object.values(config.levels).includes(level?.toUpperCase()) 
      ? level.toUpperCase() 
      : config.levels.INFO;

    const payload = {
      timestamp: new Date().toISOString(),
      level: validLevel,
      package: packageName,
      message: message,
    };

    if (stack) {
      payload.stack = stack;
    }

    switch (validLevel) {
      case config.levels.ERROR:
        console.error(JSON.stringify(payload));
        break;
      case config.levels.WARN:
        console.warn(JSON.stringify(payload));
        break;
      case config.levels.DEBUG:
        if (config.currentEnv !== 'production') {
          console.debug(JSON.stringify(payload));
        }
        break;
      case config.levels.INFO:
      default:
        console.info(JSON.stringify(payload));
        break;
    }
    
    return payload;
  } catch (err) {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'FATAL',
      package: 'logging_middleware',
      message: 'Logger encountered an internal error',
      stack: err.stack
    }));
  }
};

module.exports = {
  Log,
  levels: config.levels
};

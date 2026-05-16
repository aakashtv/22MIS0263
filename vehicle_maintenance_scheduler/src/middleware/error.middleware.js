const { Log } = require('logging_middleware');

const errorHandler = async (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  await Log(err.stack, 'ERROR', 'error-middleware', `Request failed: ${req.method} ${req.url} - ${message}`);

  res.status(statusCode).json({
    success: false,
    error: {
      message: message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

module.exports = errorHandler;

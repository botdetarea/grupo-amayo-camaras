const AppError = require('../errors/app-error');

const DATABASE_ERROR_CODES = new Set([
  'ECONNREFUSED',
  'ER_ACCESS_DENIED_ERROR',
  'ER_BAD_DB_ERROR',
  'ENOTFOUND',
  'ETIMEDOUT',
  'PROTOCOL_CONNECTION_LOST',
]);

function errorHandler(error, request, response, next) {
  if (response.headersSent) {
    return next(error);
  }

  if (error instanceof AppError) {
    return response.status(error.status).json({
      error: {
        code: error.code,
        message: error.message,
      },
    });
  }

  if (DATABASE_ERROR_CODES.has(error.code)) {
    console.error('[api] Database is unavailable:', error.code);
    return response.status(503).json({
      error: {
        code: 'database_unavailable',
        message: 'The database is unavailable. Check the MySQL service and backend credentials.',
      },
    });
  }

  if (error.type === 'entity.parse.failed') {
    return response.status(400).json({
      error: {
        code: 'invalid_json',
        message: 'The request body must contain valid JSON.',
      },
    });
  }

  if (error.type === 'entity.too.large') {
    return response.status(413).json({
      error: {
        code: 'request_too_large',
        message: 'The request body exceeds the allowed size.',
      },
    });
  }

  if (error.name === 'RateLimitError') {
    return response.status(429).json({
      error: {
        code: 'rate_limit_exceeded',
        message: 'Too many requests. Try again later.',
      },
    });
  }

  console.error('[api] Unexpected request error:', error.code || error.name || 'unknown');
  return response.status(500).json({
    error: {
      code: 'internal_error',
      message: 'An unexpected server error occurred.',
    },
  });
}

module.exports = errorHandler;

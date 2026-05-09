const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
  });

  if (err.name === 'PrismaClientInitializationError') {
    return res.status(500).json({
      success: false,
      message: 'Database connection failed. Please try again later.',
      ...(process.env.NODE_ENV !== 'production' && { error: err.message }),
    });
  }

  if (err.name === 'PrismaClientKnownRequestError') {
    if (err.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'Resource already exists.' });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Resource not found.' });
    }
    if (err.code === 'P2003') {
      return res.status(400).json({ success: false, message: 'Referenced resource does not exist.' });
    }
    if (err.code === 'P2014') {
      return res.status(400).json({ success: false, message: 'Invalid relation constraint violation.' });
    }
    if (err.code === 'P2016') {
      return res.status(400).json({ success: false, message: 'Query interpretation error.' });
    }
    return res.status(400).json({
      success: false,
      message: 'Database query error.',
      ...(process.env.NODE_ENV !== 'production' && { error: err.message }),
    });
  }

  if (err.name === 'PrismaClientValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid data provided.',
      ...(process.env.NODE_ENV !== 'production' && { error: err.message }),
    });
  }

  if (err.message?.includes('pool timeout')) {
    return res.status(503).json({
      success: false,
      message: 'Service temporarily unavailable. Database connection pool exhausted.',
    });
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }

  if (err.name === 'ValidationError') {
    return res.status(422).json({ success: false, message: err.message });
  }

  if (err.name === 'MulterError') {
    return res.status(400).json({ success: false, message: err.message });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.statusCode ? err.message : 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { error: err.message, stack: err.stack }),
  });
};

module.exports = errorHandler;
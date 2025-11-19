// Global error handling middleware

function errorHandler(err, req, res, next) {
  console.error('Error:', err);
  
  // Database errors
  if (err.code === 'SQLITE_CONSTRAINT') {
    return res.status(409).json({
      error: 'Database constraint violation',
      message: err.message
    });
  }
  
  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      message: err.message
    });
  }
  
  // Default error
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`
  });
}

module.exports = {
  errorHandler,
  notFoundHandler
};


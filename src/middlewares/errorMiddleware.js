/* eslint-env node */
/* global process */

/**
 * Global error handler middleware
 */
export const errorHandler = (err, req, res, next) => {
  console.error('Error Stack:', err.stack);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    data: null,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      error: err,
    }),
  });
};

/**
 * 404 Not Found handler
 */
export const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    data: null,
  });
};

/**
 * Database error handler
 */
export const handleDatabaseError = (error) => {
  // PostgreSQL unique violation
  if (error.code === '23505') {
    return {
      statusCode: 409,
      message: 'Resource already exists',
    };
  }

  // PostgreSQL foreign key violation
  if (error.code === '23503') {
    return {
      statusCode: 400,
      message: 'Referenced resource does not exist',
    };
  }

  // PostgreSQL not null violation
  if (error.code === '23502') {
    return {
      statusCode: 400,
      message: 'Required field is missing',
    };
  }

  // PostgreSQL check violation
  if (error.code === '23514') {
    return {
      statusCode: 400,
      message: 'Data validation failed',
    };
  }

  // Default database error
  return {
    statusCode: 500,
    message: 'Database operation failed',
  };
};

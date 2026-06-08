class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  let error = { ...err, message: err.message };

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    error = { message: `Resource not found`, statusCode: 404 };
  }
  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = { message: `${field} already exists`, statusCode: 400 };
  }
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    error = { message: messages.join('. '), statusCode: 400 };
  }
  // JWT errors
  if (err.name === 'JsonWebTokenError')  error = { message: 'Invalid token', statusCode: 401 };
  if (err.name === 'TokenExpiredError')  error = { message: 'Token expired', statusCode: 401 };

  const statusCode = error.statusCode || err.statusCode || 500;
  const message    = error.message    || 'Internal Server Error';

  if (process.env.NODE_ENV === 'development') {
    console.error('ERROR:', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = { AppError, errorHandler };

const env = require('../config/env');
const ApiError = require('../utils/ApiError');

/** Catch-all for unmatched routes; forwards a 404 into the error handler. */
function notFound(req, _res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

/** Map common Mongoose/JWT failures onto sensible HTTP status codes. */
function normaliseError(error) {
  if (error.name === 'CastError') {
    return new ApiError(400, `Invalid ${error.path}: ${error.value}`);
  }
  if (error.name === 'ValidationError') {
    const details = Object.fromEntries(
      Object.entries(error.errors).map(([field, err]) => [field, err.message]),
    );
    return new ApiError(422, 'Validation failed', details);
  }
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue || {})[0] || 'field';
    return ApiError.conflict(`That ${field} is already taken`);
  }
  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    return ApiError.unauthorized('Your session is invalid or has expired');
  }
  if (error.type === 'entity.too.large') {
    return new ApiError(413, 'Request payload is too large');
  }
  return error;
}

// eslint-disable-next-line no-unused-vars -- Express identifies error handlers by arity.
function errorHandler(err, req, res, next) {
  const error = normaliseError(err);
  const statusCode = error.statusCode || 500;

  if (statusCode >= 500) {
    console.error(`[${req.method} ${req.originalUrl}]`, err);
  }

  res.status(statusCode).json({
    success: false,
    message: statusCode >= 500 && env.isProduction ? 'Something went wrong on our end' : error.message,
    ...(error.details ? { errors: error.details } : {}),
    ...(env.isProduction ? {} : { stack: err.stack }),
  });
}

module.exports = { notFound, errorHandler };

/**
 * Wraps an async route handler so rejected promises reach Express' error
 * middleware. Without this, an `await` that throws inside an `async` handler
 * becomes an unhandled rejection and the request hangs.
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;

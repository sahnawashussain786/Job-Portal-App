const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { verifyToken } = require('../utils/generateToken');

/** Pull a bearer token from the Authorization header or the auth cookie. */
function extractToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7).trim();

  // Provider-agnostic cookie parse (the API doesn't depend on cookie-parser).
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const match = cookieHeader.split(';').find((c) => c.trim().startsWith('token='));
    if (match) return decodeURIComponent(match.split('=')[1]);
  }
  return null;
}

/**
 * Require a valid JWT and attach the user document to `req.user`.
 * Rejects deactivated accounts so an old token can't outlive a de-registration.
 */
const protect = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) throw ApiError.unauthorized('You must be signed in to do that');

  let payload;
  try {
    payload = verifyToken(token);
  } catch (error) {
    const message = error.name === 'TokenExpiredError' ? 'Session expired, please sign in again' : 'Invalid token';
    throw ApiError.unauthorized(message);
  }

  const user = await User.findById(payload.id);
  if (!user) throw ApiError.unauthorized('The account for this session no longer exists');
  if (!user.isActive) throw ApiError.forbidden('This account has been deactivated');

  req.user = user;
  return next();
});

/** Restrict a route to one or more roles, e.g. `authorize('employer', 'admin')`. */
function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden(`This action is limited to: ${roles.join(', ')}`));
    }
    return next();
  };
}

/**
 * Like `protect`, but tolerates anonymous visitors — useful on public endpoints
 * that enrich their response when the caller happens to be signed in (e.g. the
 * `isSaved` / `hasApplied` flags on a job listing).
 */
const optionalAuth = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) return next();

  try {
    const payload = verifyToken(token);
    const user = await User.findById(payload.id);
    if (user?.isActive) req.user = user;
  } catch {
    // Ignore bad tokens on public routes.
  }
  return next();
});

module.exports = { protect, authorize, optionalAuth };

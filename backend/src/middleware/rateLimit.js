const rateLimit = require('express-rate-limit');
const env = require('../config/env');

/**
 * Rate limiting is skipped in development, and we trust Vercel's proxy so the
 * real client IP is used for the key rather than the edge server's.
 */
const common = {
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !env.isProduction,
};

/** Tight limit on credential endpoints to blunt brute-force attempts. */
const authLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: { success: false, message: 'Too many attempts. Please try again in 15 minutes.' },
});

/** Generous global limit — enough headroom for normal browsing. */
const apiLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  message: { success: false, message: 'Too many requests. Please slow down.' },
});

/** Uploads are expensive; cap them separately. */
const uploadLimiter = rateLimit({
  ...common,
  windowMs: 60 * 60 * 1000,
  limit: 40,
  message: { success: false, message: 'Upload limit reached. Try again later.' },
});

module.exports = { authLimiter, apiLimiter, uploadLimiter };

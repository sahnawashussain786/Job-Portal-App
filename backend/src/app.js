const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const env = require('./config/env');
const apiRoutes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Vercel terminates TLS at its edge, so trust the first proxy hop for correct
// client IPs (needed by the rate limiter).
app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(
  helmet({
    // The API only serves JSON; CSP is handled by the Vercel-served SPA.
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);

app.use((req, _res, next) => {
  // Stash the current request so the CORS callback below can read the Host header.
  corsCurrentReq = req;
  next();
});

/** Most recent request — set by the middleware above so the CORS origin check
 * can compare the Origin header with the Host header (same-origin on Vercel). */
let corsCurrentReq;

const allowedOrigins = new Set(env.clientUrls);

app.use(
  cors({
    origin(origin, callback) {
      // Tools like curl send no Origin header — always allow those.
      if (!origin) return callback(null, true);
      // Allow anything in the explicit allowlist (dev URLs, etc.).
      if (allowedOrigins.has(origin)) return callback(null, true);
      // In production on Vercel the SPA and API share a domain. The browser still
      // sends an Origin header for same-origin requests, so we allow the host that
      // actually serves this request rather than hard-coding deployment URLs.
      if (env.isProduction && corsCurrentReq && origin === corsCurrentReq.get('Host')) return callback(null, true);
      // Dev mode: permissive so local frontends can call the API.
      if (!env.isProduction) return callback(null, true);
      return callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
  }),
);

// Limit the body size; resumes go through multipart uploads, not JSON.
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

if (!env.isProduction) {
  app.use(morgan('dev'));
}

// Lightweight root handler, handy when hitting the API domain directly.
app.get('/', (_req, res) => {
  res.json({ success: true, message: 'Job Portal API', docs: '/api/health' });
});

app.use('/api', apiRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;

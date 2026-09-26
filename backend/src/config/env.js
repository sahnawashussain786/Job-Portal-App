const path = require('path');

// Load `.env` from either the repo root (Vercel / monorepo dev) or `backend/.env`
// (running the API standalone). `dotenv` silently ignores missing files.
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Central place where environment variables are read and validated. Anything
 * that touches `process.env` should go through here so misconfiguration fails
 * loudly at boot instead of at the first request.
 */
const required = ['MONGODB_URI', 'JWT_SECRET'];

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    // Throwing here surfaces the problem in the Vercel build/runtime logs
    // rather than producing confusing 500s on every request.
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
        'Add them in Vercel → Project → Settings → Environment Variables.',
    );
  }
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction,
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jobportal',
  jwtSecret: process.env.JWT_SECRET || 'dev-only-insecure-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  adminEmail: (process.env.ADMIN_EMAIL || 'admin@jobportal.dev').toLowerCase(),
  clientUrls: (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean),
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    get enabled() {
      return Boolean(this.cloudName && this.apiKey && this.apiSecret);
    },
  },
};

module.exports = env;

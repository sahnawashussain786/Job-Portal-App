/**
 * Vercel serverless entry point.
 *
 * Every request to /api/* is rewritten here (see vercel.json). We reuse the
 * exact same Express app that runs locally, so behaviour is identical in both
 * environments. The database connection is cached between invocations by
 * `connectDB`, which is essential on serverless where cold starts are frequent.
 */
const app = require('../backend/src/app');
const { connectDB } = require('../backend/src/config/db');

module.exports = async (req, res) => {
  try {
    // Ensure Mongo is connected before handling the request. connectDB is
    // idempotent and reuses an in-flight or established connection.
    await connectDB();
  } catch (error) {
    // Without this, a bad MONGODB_URI (or an IP not allow-listed on Atlas)
    // surfaces as an opaque function crash on every request. A 503 with a
    // readable body makes the misconfiguration obvious instead.
    console.error('[api] MongoDB connection failed:', error.message);
    res.status(503).json({
      success: false,
      message: 'The API cannot reach its database right now. Check MONGODB_URI and Atlas network access.',
    });
    return;
  }

  return app(req, res);
};

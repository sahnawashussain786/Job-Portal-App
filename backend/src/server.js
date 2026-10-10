/**
 * Local development / standalone server entry.
 *
 * On Vercel this file is never executed — `api/index.js` imports the Express app
 * directly and Vercel manages the HTTP lifecycle.
 */
const app = require('./app');
const env = require('./config/env');
const { connectDB, disconnectDB } = require('./config/db');

async function start() {
  try {
    await connectDB();
    console.log('✅ MongoDB connected');

    const PORT = env.port || 5000;

    const server = app.listen(PORT, () => {
      console.log(`🚀 API listening on http://localhost:${PORT}/api (${env.nodeEnv})`);
    });

    // Close the HTTP server and the DB connection cleanly on shutdown.
    const shutdown = async (signal) => {
      console.log(`\n${signal} received — shutting down`);
      server.close(async () => {
        await disconnectDB();
        process.exit(0);
      });
    };

    ['SIGINT', 'SIGTERM'].forEach((signal) => process.on(signal, () => shutdown(signal)));
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

start();

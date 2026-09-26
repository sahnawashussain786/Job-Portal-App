const mongoose = require('mongoose');
const env = require('./env');

/**
 * Serverless-friendly Mongo connection.
 *
 * Vercel can spin up many short-lived function instances; opening a new
 * connection per request exhausts the Atlas connection pool. We therefore cache
 * the connection (and any in-flight promise) on the Node `global` object, which
 * survives between warm invocations of the same instance.
 */
let cached = global.__mongooseCache;

if (!cached) {
  cached = global.__mongooseCache = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    mongoose.set('strictQuery', true);

    cached.promise = mongoose
      .connect(env.mongoUri, {
        // Keep the pool small: each serverless instance is its own client.
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
      })
      .then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    // Reset so the next invocation retries instead of reusing a rejected promise.
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

async function disconnectDB() {
  if (cached.conn) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
  }
}

module.exports = { connectDB, disconnectDB, mongoose };

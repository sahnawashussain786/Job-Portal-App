const jwt = require('jsonwebtoken');
const env = require('../config/env');

/** Sign a JWT for a user document. Only the id and role are encoded. */
function generateToken(user) {
  return jwt.sign({ id: user._id.toString(), role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

/** Verify a token, returning the decoded payload (throws on invalid/expired). */
function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

module.exports = { generateToken, verifyToken };

const ApiError = require('../utils/ApiError');

/**
 * Lightweight validation kept deliberately dependency-free (Mongoose already
 * validates types/ranges). These helpers cover the "missing field" and "bad
 * enum value" cases and produce a consistent 422 payload.
 */
function requireFields(body, fields) {
  const missing = fields.filter((field) => {
    const value = body?.[field];
    return value === undefined || value === null || String(value).trim() === '';
  });
  if (missing.length > 0) {
    throw ApiError.badRequest(`Missing required field(s): ${missing.join(', ')}`);
  }
}

function oneOf(value, allowed, label) {
  if (value === undefined || value === null || value === '') return undefined;
  if (!allowed.includes(value)) {
    throw ApiError.badRequest(`Invalid ${label}. Allowed values: ${allowed.join(', ')}`);
  }
  return value;
}

/** Trim every string in an object — browsers love sending padded values. */
function sanitiseStrings(input) {
  if (Array.isArray(input)) return input.map(sanitiseStrings);
  if (input && typeof input === 'object') {
    return Object.fromEntries(Object.entries(input).map(([k, v]) => [k, sanitiseStrings(v)]));
  }
  return typeof input === 'string' ? input.trim() : input;
}

module.exports = { requireFields, oneOf, sanitiseStrings };

const MAX_LIMIT = 50;

/**
 * Normalise ?page & ?limit query params into safe skip/limit/page values.
 * Guards against negative numbers, NaN and oversized pages.
 */
function getPagination(query = {}) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const requested = Number.parseInt(query.limit, 10) || 10;
  const limit = Math.min(MAX_LIMIT, Math.max(1, requested));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

/** Build the pagination envelope returned alongside list endpoints. */
function buildMeta({ total, page, limit }) {
  const pages = Math.max(1, Math.ceil(total / limit));
  return {
    total,
    page,
    limit,
    pages,
    hasNextPage: page < pages,
    hasPrevPage: page > 1,
  };
}

module.exports = { getPagination, buildMeta, MAX_LIMIT };

function parsePositiveInteger(value, fieldName) {
  const number = Number(value);

  if (!Number.isInteger(number) || number <= 0) {
    const error = new Error(`${fieldName} must be a positive integer.`);
    error.statusCode = 400;
    throw error;
  }

  return number;
}

function parsePagination(query, defaults = { page: 1, limit: 20 }) {
  const hasPage = typeof query.page !== "undefined";
  const hasLimit = typeof query.limit !== "undefined";

  if (!hasPage && !hasLimit) {
    return null;
  }

  const page = hasPage
    ? parsePositiveInteger(query.page, "page")
    : defaults.page;
  const limit = hasLimit
    ? parsePositiveInteger(query.limit, "limit")
    : defaults.limit;

  return {
    page,
    limit,
    offset: (page - 1) * limit,
  };
}

function buildPaginationMeta({ page, limit, total }) {
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    page,
    limit,
    total,
    total_pages: totalPages,
    has_next: page < totalPages,
    has_prev: page > 1,
  };
}

module.exports = {
  buildPaginationMeta,
  parsePagination,
};

"use strict";


const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 200;

const getPagination = (query = {}) => {
  const requestedPaging = query.page !== undefined || query.limit !== undefined;
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(query.limit, 10) || DEFAULT_LIMIT));
  const offset = (page - 1) * limit;
  return { requestedPaging, page, limit, offset };
};

const buildMeta = (page, limit, total, rowCount, offset) => ({
  page,
  limit,
  total,
  pages: Math.ceil(total / limit),
  hasNext: offset + rowCount < total,
  hasPrev: page > 1,
});

module.exports = { getPagination, buildMeta, DEFAULT_LIMIT, MAX_LIMIT };

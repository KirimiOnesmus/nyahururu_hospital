"use strict";

// M-5: nine `getAll*` endpoints (news, events, notices, feedback, fraud
// reports, inventory, vehicles, services, doctors) previously had no
// LIMIT at all — the whole table came back on every request, growing
// unbounded over the life of the deployment and, for the unauthenticated
// endpoints among these, giving anyone a cheap way to make the DB do more
// work than necessary per request (OWASP API4:2023).
//
// This mirrors the page/limit/offset pattern already proven correct in
// userController.getAllUsers, but stays response-shape-compatible with
// today's frontend by design:
//   - No ?page/?limit on the request  -> same plain-array response the
//     frontend already parses everywhere, just capped at DEFAULT_LIMIT
//     rows instead of unbounded. This is the only behavior change for
//     every existing caller today.
//   - ?page and/or ?limit supplied     -> caller is opting into real
//     pagination; use buildMeta() to return the {page, limit, total,
//     pages, hasNext, hasPrev} envelope so a future paginated admin UI
//     can be built against it without another backend change.

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

"use strict";

process.env.NODE_ENV = "test";
process.env.DB_HOST ||= "127.0.0.1";
process.env.DB_PORT ||= "3306";
process.env.DB_NAME ||= "ncrh_test";
process.env.DB_USER ||= "ncrh_test";
process.env.DB_PASSWORD ??= "";

const test = require("node:test");
const assert = require("node:assert/strict");
const { __test } = require("../services/import/importService");
const { Service } = require("../sequelize/models");
const serviceDefinition = require("../services/import/entities/services");
const importRouter = require("../controllers/importController");
const serviceController = require("../controllers/servicesController");

function mockResponse() {
  return {
    statusCode: 200,
    body: null,
    headers: {},
    status(code) { this.statusCode = code; return this; },
    set(name, value) { this.headers[name] = value; return this; },
    json(body) { this.body = body; return this; },
  };
}

test("CSV parser accepts quoted delimiters and line breaks, rejects duplicate headers", () => {
  const [row] = __test.parseCsvText('\uFEFFname,description\r\n"Lab, North","First line\nSecond line"\r\n');
  assert.equal(row.name, "Lab, North");
  assert.equal(row.description, "First line\nSecond line");
  assert.throws(() => __test.parseCsvText("name,name\nA,B\n"));
  assert.deepEqual(__test.parseCsvText(""), []);
});

test("generated template follows the entity's declared column order", () => {
  const template = __test.csvTemplate({
    columns: [
      { name: "name", required: true, type: "string" },
      { name: "division", required: true, type: "enum", values: ["Outpatient"] },
      { name: "isPublished", type: "boolean" },
    ],
  });
  assert.equal(template.split("\r\n")[0], "name,division,isPublished");
  assert.equal(template.split("\r\n")[1], "Example department,Outpatient,true");
});

test("strict headers reject missing, unknown and forbidden fields", () => {
  const definition = { columns: [{ name: "name" }, { name: "description" }], forbidden: ["id", "imageUrl"] };
  assert.equal(__test.checkHeaders(["name", "description"], definition), null);
  assert.equal(__test.checkHeaders(["name", "id"], definition).code, "FORBIDDEN_COLUMN");
  assert.equal(__test.checkHeaders(["name", "unknown"], definition).code, "BAD_HEADER");
});

test("validation rejects HTML and invalid money with row and column details", () => {
  const errors = [];
  __test.parseCell("<script>alert(1)</script>", { name: "description", type: "string", max: 100, required: true }, 2, errors);
  __test.parseCell("12.345", { name: "cashMin", type: "money" }, 2, errors);
  assert.deepEqual(errors.map(({ column, code }) => [column, code]), [
    ["description", "HTML_NOT_ALLOWED"],
    ["cashMin", "INVALID_MONEY"],
  ]);
});

test("validation blocks case-insensitive duplicate natural keys and inconsistent prices", async () => {
  const definition = {
    naturalKey: "name",
    columns: [
      { name: "name", attribute: "name", type: "string", required: true, max: 100 },
      { name: "cashMin", attribute: "cashMin", type: "money" },
      { name: "cashMax", attribute: "cashMax", type: "money" },
    ],
    model: { findOne: async () => null },
  };
  const result = await __test.validateRows(definition, [
    { name: "Radiology", cashMin: "500", cashMax: "100" },
    { name: "radiology", cashMin: "", cashMax: "" },
  ], "upsert");
  assert.ok(result.errors.some((error) => error.code === "DUPLICATE_KEY"));
  assert.ok(result.errors.some((error) => error.code === "MIN_EXCEEDS_MAX"));
  assert.equal(result.normalized.length, 2);
});

test("error CSV output neutralises spreadsheet formulas", () => {
  assert.equal(__test.escapeCsv("=1+1"), "'=1+1");
  assert.equal(__test.escapeCsv("Plain, text"), '"Plain, text"');
});

test("service model derives new SHA coverage but preserves unreviewed legacy flags", async () => {
  const legacy = Service.build({ name: "Legacy clinic", division: "Outpatient", category: "General Medicine", description: "Legacy data", nhifCovered: true });
  await legacy.validate();
  assert.equal(legacy.shaCoverage, null);
  assert.equal(legacy.nhifCovered, true);

  const classified = Service.build({ name: "Clinic", division: "Outpatient", category: "General Medicine", description: "Reviewed data", itemsTotal: 8, itemsShaCovered: 2 });
  await classified.validate();
  assert.equal(classified.shaCoverage, "partial");
  assert.equal(classified.nhifCovered, true);
});

test("Registration and Mortuary Services default to unpublished unless explicitly set", async () => {
  const definition = {
    ...serviceDefinition,
    model: { findOne: async () => null },
  };
  const rows = await __test.validateRows(definition, [
    { name: "Registration", division: "Outpatient", category: "Others", description: "Registration counter" },
    { name: "Mortuary Services", division: "Outpatient", category: "Others", description: "Mortuary" },
  ], "upsert");
  assert.equal(rows.normalized[0].values.isPublished, false);
  assert.equal(rows.normalized[1].values.isPublished, false);
});

test("import authorization only admits superadmin and rejects stale commit authentication", () => {
  const { requireSuperadmin, requireCsrfHeader, requireFreshAuth } = importRouter.__test;
  assert.equal(importRouter.__test.skipRateLimit({ user: { role: "superadmin" } }), true);
  assert.equal(importRouter.__test.skipRateLimit({ user: { role: "admin" } }), false);
  const denied = mockResponse();
  requireSuperadmin({ user: { role: "admin" } }, denied, () => assert.fail("admin must not pass"));
  assert.equal(denied.statusCode, 403);

  let proceeded = false;
  requireSuperadmin({ user: { role: "superadmin" } }, mockResponse(), () => { proceeded = true; });
  assert.equal(proceeded, true);

  const csrfDenied = mockResponse();
  requireCsrfHeader({ get: () => undefined }, csrfDenied, () => assert.fail("missing CSRF header must not pass"));
  assert.equal(csrfDenied.statusCode, 403);

  const staleAuth = mockResponse();
  requireFreshAuth({ user: { lastLogin: new Date(Date.now() - 16 * 60 * 1000) }, decodedToken: { iat: Math.floor(Date.now() / 1000) } }, staleAuth, () => assert.fail("refreshed token must not make old password auth fresh"));
  assert.equal(staleAuth.statusCode, 401);

  let freshProceeded = false;
  requireFreshAuth({ user: { lastLogin: new Date() }, decodedToken: { iat: Math.floor(Date.now() / 1000) - 2 * 60 * 60 } }, mockResponse(), () => { freshProceeded = true; });
  assert.equal(freshProceeded, true);
});

test("public services API hides unpublished rows and preserves an unpaged array response", async () => {
  const original = Service.findAndCountAll;
  let query;
  Service.findAndCountAll = async (options) => { query = options; return { rows: [{ id: 1 }], count: 1 }; };
  try {
    const response = mockResponse();
    await serviceController.getAllServices({ query: {} }, response);
    assert.deepEqual(response.body, [{ id: 1 }]);
    assert.equal(query.where.isPublished, true);
    assert.equal(query.limit, undefined);
    assert.match(response.headers["Cache-Control"], /max-age=60/);

    const managed = mockResponse();
    await serviceController.getAllServices({ query: {}, includeUnpublished: true }, managed);
    assert.equal(query.where.isPublished, undefined);
  } finally { Service.findAndCountAll = original; }
});

test("public services API rejects invalid filters and pagination", async () => {
  const response = mockResponse();
  await serviceController.getAllServices({ query: { division: "Unknown", limit: "20" } }, response);
  assert.equal(response.statusCode, 400);
});

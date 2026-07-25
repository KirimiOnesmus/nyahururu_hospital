

"use strict";


let logger;
try {
  logger = require("./logger");
} catch {
  logger = {
    warn:  (...a) => console.warn("[WARN]",  ...a),
    error: (...a) => console.error("[ERROR]", ...a),
  };
}


class AppError extends Error {
 
  constructor(message, statusCode, errors = []) {
    super(message);


    if (typeof statusCode !== "number" || !Number.isInteger(statusCode)) {
      console.error(
        `[AppError] statusCode must be an integer. Received: ${JSON.stringify(statusCode)}. Defaulting to 500.`
      );
      statusCode = 500;
    }


    this.statusCode = statusCode;


    this.status = statusCode >= 500 ? "error" : "fail";
    this.isOperational = true;
    this.errors = Array.isArray(errors) ? errors : [];

    Error.captureStackTrace(this, this.constructor);
  }
}


 // 2. asyncHandler — Eliminates try/catch boilerplate in controllers
 
const asyncHandler = (fn) => (req, res, next) => {

  Promise.resolve(fn(req, res, next)).catch(next);
};


 // 3. sendSuccess — Standardised Success Response

const sendSuccess = (res, statusCode, message, data = null, meta = null) => {
  if (typeof statusCode !== "number" || !Number.isInteger(statusCode)) {
    console.error(`[sendSuccess] statusCode must be an integer. Received: ${JSON.stringify(statusCode)}.`);
    statusCode = 200;
  }

  const body = { success: true, message };

  if (data !== null) {
    body.data = data;
  }

  // Enforce consistent pagination meta shape.
  if (meta !== null && typeof meta === "object") {
    body.meta = {
      ...(meta.page    !== undefined && { page:    Number(meta.page) }),
      ...(meta.limit   !== undefined && { limit:   Number(meta.limit) }),
      ...(meta.total   !== undefined && { total:   Number(meta.total) }),
      ...(meta.pages   !== undefined && { pages:   Number(meta.pages) }),
      ...(meta.hasNext !== undefined && { hasNext: Boolean(meta.hasNext) }),
      ...(meta.hasPrev !== undefined && { hasPrev: Boolean(meta.hasPrev) }),
     
      ...meta,
    };
  }

  return res.status(statusCode).json(body);
};

// 4. sendError — Standardised Error Response

const sendError = (res, statusCode, message, errors = []) => {
  if (typeof statusCode !== "number" || !Number.isInteger(statusCode)) {
    console.error(`[sendError] statusCode must be an integer. Received: ${JSON.stringify(statusCode)}.`);
    statusCode = 500;
  }

  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors.length > 0 && { errors }),
  });
};

// 5. normalizeFrameworkError — Normalises framework errors → AppError
//
// Handles:
//   • Sequelize errors (primary datastore)
//   • Legacy Mongoose error shapes (kept during transition; can be
//     deleted once the Mongoose deps are uninstalled and it's clear
//     nothing raises them any more)
//   • JWT errors
//   • express-body-parser JSON errors
//   • Multer upload errors
//
// Anything not matched is passed through unchanged and turned into a
// generic 500 by the caller.

const normalizeFrameworkError = (err) => {

  // ── Sequelize (primary datastore) ────────────────────────────────

  // UNIQUE constraint (e.g. duplicate email). err.errors is an array
  // of per-column detail; we surface the first column name in the
  // message so the frontend can highlight the right field.
  if (err.name === "SequelizeUniqueConstraintError") {
    const first = err.errors?.[0];
    const field   = first?.path || Object.keys(err.fields || {})[0] || "field";
    const value   = first?.value ?? err.fields?.[field];
    const display = value ? ` '${value}'` : "";
    return new AppError(
      `${field}${display} is already in use. Please choose a different value.`,
      409,
    );
  }

  // Validation errors from model-level validators (allowNull, isEmail,
  // custom validate: functions). Preserve the per-field errors array
  // so the frontend can render field-scoped messages.
  if (err.name === "SequelizeValidationError") {
    const errors = (err.errors || []).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return new AppError("Validation failed. Please check your input.", 422, errors);
  }

  // Foreign-key violation — trying to reference a row that doesn't
  // exist, or deleting a row still referenced by others. Return 409
  // (conflict) rather than 400 because the request itself is
  // syntactically valid; it just conflicts with current DB state.
  if (err.name === "SequelizeForeignKeyConstraintError") {
    return new AppError(
      "Referenced record is missing, or this record is still in use by other data.",
      409,
    );
  }

  // Timeouts — DB is slow / overloaded. 504 signals "try again".
  if (err.name === "SequelizeTimeoutError") {
    return new AppError(
      "The database took too long to respond. Please try again shortly.",
      504,
    );
  }

  // Connection-layer failures — DB down, refused, host lookup
  // failed. 503 says "service temporarily unavailable" so a client
  // knows to retry with backoff rather than treat it as a 4xx.
  if (
    err.name === "SequelizeConnectionError" ||
    err.name === "SequelizeConnectionRefusedError" ||
    err.name === "SequelizeHostNotFoundError" ||
    err.name === "SequelizeHostNotReachableError" ||
    err.name === "SequelizeAccessDeniedError" ||
    err.name === "SequelizeConnectionTimedOutError" ||
    err.name === "SequelizeConnectionAcquireTimeoutError"
  ) {
    logger.error({ err }, "Sequelize connection-layer error");
    return new AppError(
      "A database error occurred. Please try again shortly.",
      503,
    );
  }

  // Base database error (bad SQL, unknown column, invalid ENUM
  // value, etc.). Don't leak the DB message to clients — it can
  // reveal schema details. Log server-side, return generic 500.
  if (err.name === "SequelizeDatabaseError") {
    logger.error(
      { err, sql: err.sql, original: err.original?.message },
      "Sequelize database error",
    );
    return new AppError("An unexpected database error occurred.", 500);
  }

  // Any remaining Sequelize base-class error we haven't handled
  // explicitly. Same "log server, generic response" policy.
  if (err.name?.startsWith("Sequelize")) {
    logger.error({ err }, "Unhandled Sequelize error");
    return new AppError("An unexpected database error occurred.", 500);
  }

  // ── Legacy Mongoose (transitional) ───────────────────────────────
  //
  // These branches don't fire once Mongoose is uninstalled — they're
  // preserved during the transition window and can be deleted with
  // the final cleanup pass.

  if (err.code === 11000) {
    const field   = Object.keys(err.keyValue || {})[0] || "field";
    const value   = err.keyValue?.[field];
    const display = value ? ` '${value}'` : "";
    return new AppError(
      `${field}${display} is already in use. Please choose a different value.`,
      409,
    );
  }

  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => ({
      field:   e.path,
      message: e.message,
    }));
    return new AppError("Validation failed. Please check your input.", 422, errors);
  }

  if (err.name === "CastError") {
    return new AppError(
      `Invalid value '${err.value}' for field '${err.path}'. Expected a valid ID.`,
      400,
    );
  }

  if (err.name === "MongoNetworkError" || err.name === "MongoServerError") {
    return new AppError(
      "A database error occurred. Please try again shortly.",
      503,
    );
  }

  // ── JWT ──────────────────────────────────────────────────────────

  if (err.name === "JsonWebTokenError") {
    return new AppError("Invalid token. Please log in again.", 401);
  }
  if (err.name === "TokenExpiredError") {
    return new AppError("Your session has expired. Please log in again.", 401);
  }
  if (err.name === "NotBeforeError") {
    return new AppError("Token is not yet valid. Please try again shortly.", 401);
  }

  // ── Express body parsers ────────────────────────────────────────

  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return new AppError(
      "Malformed JSON in request body. Please check your request format.",
      400,
    );
  }

  // ── Multer ──────────────────────────────────────────────────────

  if (err.name === "MulterError") {
    const messages = {
      LIMIT_FILE_SIZE:      "File is too large. Please upload a smaller file.",
      LIMIT_FILE_COUNT:     "Too many files uploaded. Please reduce the number of files.",
      LIMIT_FIELD_KEY:      "File field name is too long.",
      LIMIT_FIELD_VALUE:    "File field value is too long.",
      LIMIT_UNEXPECTED_FILE:`Unexpected file field '${err.field}'. Check the field name.`,
    };
    return new AppError(messages[err.code] || `Upload error: ${err.message}`, 400);
  }

  return err;
};

// Back-compat alias — nothing else in the codebase currently calls
// handleMongooseErrors, but keeping the export path in case anything
// external does.
const handleMongooseErrors = normalizeFrameworkError;


const globalErrorHandler = (err, req, res, next) => { 

  //  Step 1: Normalise known framework errors  AppError 
  
  if (!err.isOperational) {
    err = handleMongooseErrors(err);
  }

  // Step 2: Defensive statusCode normalisation 

  err.statusCode = typeof err.statusCode === "number" && Number.isInteger(err.statusCode)
    ? err.statusCode
    : 500;

  err.status = err.status || (err.statusCode >= 500 ? "error" : "fail");

  //  Step 3: Structured logging with full request context 

  const logContext = {
    method:     req.method,
    path:       req.originalUrl,
    ip:         req.ip,
    statusCode: err.statusCode,
    userId:     req.user?.id || "unauthenticated",
  };

  if (err.statusCode >= 500) {
    logger.error({ err, ...logContext }, `[${err.statusCode}] ${err.message}`);
  } else {
    logger.warn({ ...logContext, message: err.message }, `[${err.statusCode}] ${err.message}`);
  }

  //  Step 4: Development — full error details 
  if (process.env.NODE_ENV === "development") {
    return res.status(err.statusCode).json({
      success:    false,
      status:     err.status,
      message:    err.message,
      errors:     err.errors || [],
      stack:      err.stack,
    });
  }

  //Step 5: Production — operational errors (safe to expose)

  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors?.length > 0 && { errors: err.errors }),
    });
  }

  //  Step 6: Production — unknown/programming errors

  return res.status(500).json({
    success: false,
    message: "Something went wrong. Please try again later.",
  });
};

module.exports = {
  AppError,
  asyncHandler,
  sendSuccess,
  sendError,
  handleMongooseErrors,
  globalErrorHandler,
};
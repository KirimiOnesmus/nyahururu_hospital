

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


const asyncHandler = (fn) => (req, res, next) => {

  Promise.resolve(fn(req, res, next)).catch(next);
};


const sendSuccess = (res, statusCode, message, data = null, meta = null) => {
  if (typeof statusCode !== "number" || !Number.isInteger(statusCode)) {
    console.error(`[sendSuccess] statusCode must be an integer. Received: ${JSON.stringify(statusCode)}.`);
    statusCode = 200;
  }

  const body = { success: true, message };

  if (data !== null) {
    body.data = data;
  }


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



const normalizeFrameworkError = (err) => {

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

  if (err.name === "SequelizeValidationError") {
    const errors = (err.errors || []).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return new AppError("Validation failed. Please check your input.", 422, errors);
  }

  if (err.name === "SequelizeForeignKeyConstraintError") {
    return new AppError(
      "Referenced record is missing, or this record is still in use by other data.",
      409,
    );
  }


  if (err.name === "SequelizeTimeoutError") {
    return new AppError(
      "The database took too long to respond. Please try again shortly.",
      504,
    );
  }


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

  if (err.name === "SequelizeDatabaseError") {
    const dbMessage = String(err.original?.message || err.message || "");
    if (/incorrect|invalid|truncated|out of range|cannot convert|wrong value/i.test(dbMessage)) {
      return new AppError("Invalid input. Please check your values and try again.", 400);
    }
    logger.error(
      { err, sql: err.sql, original: err.original?.message },
      "Sequelize database error",
    );
    return new AppError("An unexpected database error occurred.", 500);
  }

  if (err.message && err.message.startsWith("CORS:")) {
    return new AppError(err.message, 403);
  }

  if (err.name?.startsWith("Sequelize")) {
    logger.error({ err }, "Unhandled Sequelize error");
    return new AppError("An unexpected database error occurred.", 500);
  }

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

  if (err.name === "JsonWebTokenError") {
    return new AppError("Invalid token. Please log in again.", 401);
  }
  if (err.name === "TokenExpiredError") {
    return new AppError("Your session has expired. Please log in again.", 401);
  }
  if (err.name === "NotBeforeError") {
    return new AppError("Token is not yet valid. Please try again shortly.", 401);
  }

  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return new AppError(
      "Malformed JSON in request body. Please check your request format.",
      400,
    );
  }
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

const handleMongooseErrors = normalizeFrameworkError;


const globalErrorHandler = (err, req, res, next) => { 


  if (!err.isOperational) {
    err = handleMongooseErrors(err);
  }

  err.statusCode = typeof err.statusCode === "number" && Number.isInteger(err.statusCode)
    ? err.statusCode
    : 500;

  err.status = err.status || (err.statusCode >= 500 ? "error" : "fail");

 
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

  if (process.env.NODE_ENV === "development") {
    return res.status(err.statusCode).json({
      success:    false,
      status:     err.status,
      message:    err.message,
      errors:     err.errors || [],
      stack:      err.stack,
    });
  }


  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors?.length > 0 && { errors: err.errors }),
    });
  }

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
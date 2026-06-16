

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

// 5. handleMongooseErrors — Normalises Framework Errors → AppError

const handleMongooseErrors = (err) => {

  if (err.code === 11000) {
    const field   = Object.keys(err.keyValue || {})[0] || "field";
    const value   = err.keyValue?.[field];
    const display = value ? ` '${value}'` : "";
    return new AppError(
      `${field}${display} is already in use. Please choose a different value.`,
      409
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
      400
    );
  }

  //  MongoDB: network / connection / server errors 
  if (err.name === "MongoNetworkError" || err.name === "MongoServerError") {
    return new AppError(
      "A database error occurred. Please try again shortly.",
      503
    );
  }

  // JWT: tampered or malformed token 
  if (err.name === "JsonWebTokenError") {
    return new AppError("Invalid token. Please log in again.", 401);
  }

  // JWT: expired token 
  if (err.name === "TokenExpiredError") {
    return new AppError("Your session has expired. Please log in again.", 401);
  }

  // JWT: token used before its nbf claim 
  if (err.name === "NotBeforeError") {
    return new AppError("Token is not yet valid. Please try again shortly.", 401);
  }

  // Express body-parser: malformed JSON request body 
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return new AppError(
      "Malformed JSON in request body. Please check your request format.",
      400
    );
  }

  // Multer: file upload errors
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
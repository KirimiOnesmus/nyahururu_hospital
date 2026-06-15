class AppError extends Error {
  constructor(message, statusCode, errors = []) {
    super(message);
    this.statusCode  = statusCode;
    this.status      = statusCode >= 500 ? "error" : "fail";
    this.isOperational = true;
    this.errors      = errors; 

    Error.captureStackTrace(this, this.constructor);
  }
}


const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const sendSuccess = (res, statusCode, message, data = null, meta = null) => {
  const body = { success: true, message };
  if (data !== null) body.data = data;
  if (meta !== null) body.meta = meta;
  return res.status(statusCode).json(body);
};


const globalErrorHandler = (err, req, res, next) => {

  err.statusCode = err.statusCode || 500;
  err.status     = err.status     || "error";

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
      errors:  err.errors || [],
    });
  }


  console.error("UNHANDLED ERROR:", err);
  return res.status(500).json({
    success: false,
    message: "Something went wrong. Please try again later.",
  });
};


const handleMongooseErrors = (err) => {

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return new AppError(`${field} already exists`, 409);
  }


  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => ({
      field:   e.path,
      message: e.message,
    }));
    return new AppError("Validation failed", 422, errors);
  }

  if (err.name === "CastError") {
    return new AppError(`Invalid ${err.path}: ${err.value}`, 400);
  }

  if (err.name === "JsonWebTokenError") {
    return new AppError("Invalid token. Please log in again.", 401);
  }
  if (err.name === "TokenExpiredError") {
    return new AppError("Your token has expired. Please log in again.", 401);
  }

  return err;
};

module.exports = { AppError, asyncHandler, sendSuccess, globalErrorHandler, handleMongooseErrors };

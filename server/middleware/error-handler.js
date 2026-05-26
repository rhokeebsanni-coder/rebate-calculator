const errorHandlerMiddleware = (err, req, res, next) => {
  // Default error object
  const defaultError = {
    statusCode: err.statusCode || 500,
    message: err.message || "Internal Server Error",
  };

  // Mongoose validation error handling
  if (err.name === "ValidationError") {
    defaultError.statusCode = 400;
    defaultError.message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    defaultError.statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    defaultError.message = `${field} already exists`;
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    defaultError.statusCode = 401;
    defaultError.message = "Invalid authentication token";
  }

  if (err.name === "TokenExpiredError") {
    defaultError.statusCode = 401;
    defaultError.message = "Authentication token has expired";
  }

  return res.status(defaultError.statusCode).json({
    success: false,
    message: defaultError.message,
    ...(process.env.NODE_ENV === "development" && { error: err }),
  });
};

module.exports = errorHandlerMiddleware;

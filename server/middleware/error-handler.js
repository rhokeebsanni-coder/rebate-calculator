const errorHandlerMiddleware = (err, req, res, _next) => {
  const defaultError = {
    statusCode: err.statusCode || 500,
    message: err.message || "Internal Server Error",
  };

  if (err.name === "ValidationError") {
    defaultError.statusCode = 400;
    defaultError.message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  }

  if (err.code === 11000) {
    defaultError.statusCode = 409; // 409 Conflict is more accurate than 400
    const field = Object.keys(err.keyValue)[0];
    defaultError.message = `${field} already exists`;
  }

  if (err.name === "CastError") {
    defaultError.statusCode = 400;
    defaultError.message = `Invalid ${err.path}: ${err.value}`;
  }

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
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
      name: err.name,
    }),
  });
};

module.exports = errorHandlerMiddleware;

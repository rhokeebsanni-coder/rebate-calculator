const jwt = require("jsonwebtoken");
const User = require("../models/users.js");
const CustomError = require("../errors/custom-error.js");

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new CustomError("No token provided, authorization denied", 401);
  }
  const token = authHeader.split(" ")[1];

  try {

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    next(); // 🔥 THIS WAS MISSING
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return next(new CustomError("Token expired.", 401));
    }

    return next(new CustomError("Invalid token.", 401));
  }
};

module.exports = authMiddleware;

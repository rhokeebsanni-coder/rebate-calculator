const jwt = require("jsonwebtoken");
const CustomError = require("../errors/custom-error.js");

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new CustomError("No token provided.", 401));
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return next(new CustomError("Invalid or expired token.", 401));
  }
};

module.exports = authMiddleware;

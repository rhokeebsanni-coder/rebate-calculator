const jwt = require("jsonwebtoken");
const User = require("../models/users.js");
const CustomError = require("../errors/custom-error.js");

const authMiddleware = async (req, res) => {
  // Support both Authorization header and HttpOnly cookie.
  // Header takes precedence for API clients; cookie for browser clients.
  let token;

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    throw new CustomError("No token provided.", 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify the user still exists and is active — a valid token for a
    // deleted or deactivated account should not grant access.
    const user = await User.findOne({ _id: decoded.userId, isActive: true });

    if (!user) {
      throw new CustomError("Account not found or deactivated.", 401);
    }

    // Verify the user is verified — unverified users should not access
    // protected routes even with a valid token.
    if (!user.isVerified) {
      throw new CustomError("Account not verified.", 403);
    }

    // Attach minimal identity to req — never the full user document.
    req.user = { userId: decoded.userId };

    
  } catch (error) {
    // Distinguish expiry from other errors for clearer client handling.
    if (error.name === "TokenExpiredError") {
      throw new CustomError("Token expired.", 401);
    }
    throw new CustomError("Invalid token.", 401);
  }
};

module.exports = authMiddleware;

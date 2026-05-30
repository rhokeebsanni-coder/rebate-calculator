const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/users.js");
const CustomError = require("../errors/custom-error.js");

const refreshToken = async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    throw new CustomError("No refresh token provided.", 401);
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new CustomError("Refresh token expired. Please log in again.", 401);
    }
    throw new CustomError("Invalid refresh token.", 401);
  }

  const user = await User.findOne({
    _id: decoded.userId,
    isActive: true,
  }).select("+refreshJti");

  if (!user) {
    throw new CustomError("Account not found or deactivated.", 401);
  }

  if (user.refreshJti && user.refreshJti !== decoded.jti) {
    user.refreshJti = null;
    await user.save();
    throw new CustomError(
      "Refresh token reuse detected. Please log in again.",
      401,
    );
  }

  const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });

  const newJti = crypto.randomUUID();
  const newRefreshToken = jwt.sign(
    { userId: user._id, jti: newJti },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" },
  );

  user.refreshJti = newJti;
  await user.save();

  res.cookie("refreshToken", newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(200).json({ success: true, accessToken });
};

const logout = async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      await User.findByIdAndUpdate(decoded.userId, { refreshJti: null }).select(
        "+refreshJti",
      );
    } catch (_) {
      // Token already invalid — still clear the cookie
    }
  }

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
  });

  res.status(200).json({ success: true, message: "Logged out." });
};

module.exports = { refreshToken, logout };

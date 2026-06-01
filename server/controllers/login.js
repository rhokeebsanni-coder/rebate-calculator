const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const User = require("../models/users");
const CustomError = require("../errors/custom-error");
const { sendVerificationEmail } = require("./auth.js");

// ---------------- RATE LIMIT (IP) ----------------
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const LOCKOUT_MS = 30 * 60 * 1000;

const checkRateLimit = (ip) => {
  const now = Date.now();
  const entry = loginAttempts.get(ip);

  if (!entry) {
    loginAttempts.set(ip, {
      count: 0,
      windowStart: now,
      lockedUntil: null,
    });
    return;
  }

  if (entry.lockedUntil && now < entry.lockedUntil) {
    const mins = Math.ceil((entry.lockedUntil - now) / 60000);
    throw new CustomError(
      `Too many attempts. Try again in ${mins} minute(s).`,
      429,
    );
  }

  if (now - entry.windowStart > WINDOW_MS) {
    entry.count = 0;
    entry.windowStart = now;
    entry.lockedUntil = null;
  }
};

const recordFailed = (ip) => {
  const now = Date.now();
  const entry = loginAttempts.get(ip) || {
    count: 0,
    windowStart: now,
    lockedUntil: null,
  };

  entry.count += 1;

  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockedUntil = now + LOCKOUT_MS;
  }

  loginAttempts.set(ip, entry);
};

const clearAttempts = (ip) => loginAttempts.delete(ip);

// ---------------- LOGIN ----------------
const login = async (req, res) => {
  const clientIp =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown";

  checkRateLimit(clientIp);

  const email = req.body.email?.trim().toLowerCase();
  const { password } = req.body;

  if (!email || !password) {
    throw new CustomError("Email and password are required.", 400);
  }

  // IMPORTANT: must explicitly select password because select:false
  const user = await User.findOne({ email }).select(
    "+password +failedLoginAttempts +lockedUntil +refreshJti +isVerified +isActive",
  );

  if (!user) {
    recordFailed(clientIp);
    throw new CustomError("Invalid credentials.", 401);
  }

  // account lock (DB-level)
  if (user.lockedUntil && user.lockedUntil > Date.now()) {
    const mins = Math.ceil((user.lockedUntil - Date.now()) / 60000);
    throw new CustomError(
      `Account locked. Try again in ${mins} minute(s).`,
      429,
    );
  }

  // inactive account
  if (!user.isActive) {
    throw new CustomError("Account disabled.", 403);
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    recordFailed(clientIp);

    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

    if (user.failedLoginAttempts >= MAX_ATTEMPTS) {
      user.lockedUntil = new Date(Date.now() + LOCKOUT_MS);
      user.failedLoginAttempts = 0;
    }

    await user.save();

    throw new CustomError("Invalid credentials.", 401);
  }

  // success reset
  user.failedLoginAttempts = 0;
  user.lockedUntil = null;
  clearAttempts(clientIp);

  // ---------------- OTP CHECK ----------------
  if (!user.isVerified) {
    const otp = crypto.randomInt(100000, 1000000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);

    user.verificationOTP = hashedOtp;
    user.otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    user.otpSentAt = new Date();

    await user.save();

    await sendVerificationEmail(user.email, otp);

    return res.status(200).json({
      success: true,
      requiresVerification: true,
      message: "Verification OTP sent.",
    });
  }

  // ---------------- TOKENS ----------------
  const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });

  const refreshJti = crypto.randomUUID();

  const refreshToken = jwt.sign(
    { userId: user._id, jti: refreshJti },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" },
  );

  user.refreshJti = refreshJti;
  await user.save();

  return res.status(200).json({
    success: true,
    requiresVerification: false,
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      username: user.username,
      image: user.image,
    },
  });
};

module.exports = login;

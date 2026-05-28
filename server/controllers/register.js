const bcrypt = require("bcrypt");
const crypto = require("crypto");
const User = require("../models/users");
const CustomError = require("../errors/custom-error");
const { sendVerificationEmail } = require("./auth.js");

// FIX #4 — In-memory rate limiter for registration attempts per IP.
// Replace with a Redis-backed solution (e.g. express-rate-limit + rate-limit-redis)
// in production for persistence across restarts and multiple instances.
const registrationAttempts = new Map();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

const isRateLimited = (ip) => {
  const now = Date.now();
  const entry = registrationAttempts.get(ip);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    registrationAttempts.set(ip, { count: 1, windowStart: now });
    return false;
  }

  if (entry.count >= MAX_ATTEMPTS) return true;

  entry.count++;
  return false;
};

// FIX #6 — Username validation: enforce length and safe characters only.
const isValidUsername = (username) => {
  return (
    typeof username === "string" &&
    username.length >= 3 &&
    username.length <= 30 &&
    /^[a-zA-Z0-9_.-]+$/.test(username)
  );
};

// FIX #5 — Enforce password complexity beyond just length.
const isStrongPassword = (password) => {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&        // at least one uppercase
    /[a-z]/.test(password) &&        // at least one lowercase
    /[0-9]/.test(password) &&        // at least one digit
    /[^A-Za-z0-9]/.test(password)   // at least one special character
  );
};

const register = async (req, res) => {
  // FIX #4 — Apply rate limiting before any processing.
  const clientIp =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown";

  if (isRateLimited(clientIp)) {
    throw new CustomError(
      "Too many registration attempts. Please try again later.",
      429
    );
  }

  const email = req.body.email?.trim().toLowerCase();
  const username = req.body.username?.trim();
  const { password, confirmPassword } = req.body;

  if (!email || !username || !password || !confirmPassword) {
    throw new CustomError("Please complete all required fields.", 400);
  }

  if (password !== confirmPassword) {
    throw new CustomError("Password confirmation mismatch.", 400);
  }

  // FIX #5 — Replace basic length check with full complexity validation.
  if (!isStrongPassword(password)) {
    throw new CustomError(
      "Password must be at least 8 characters and include an uppercase letter, lowercase letter, number, and special character.",
      400
    );
  }

  // FIX #6 — Reject invalid usernames early.
  if (!isValidUsername(username)) {
    throw new CustomError(
      "Username must be 3–30 characters and contain only letters, numbers, underscores, hyphens, or dots.",
      400
    );
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    // FIX #2 — No longer silently linking a password to a Google account
    // on registration. If an OAuth-only account needs a password, that flow
    // should live behind an authenticated endpoint (e.g. PATCH /account/set-password)
    // where the user is already logged in and their identity is confirmed.
    //
    // FIX #7 — Return a generic 409 regardless of whether the account uses
    // Google OAuth or has a password, to avoid leaking account state.
    throw new CustomError("Email already registered.", 409);
  }

  // FIX #3 — Replace Math.random() with crypto.randomInt() for a
  // cryptographically secure OTP.
  const verificationOTP = crypto.randomInt(100000, 1000000).toString();
  const hashedOtp = await bcrypt.hash(verificationOTP, 10);
  const otpExpiresAt = Date.now() + 15 * 60 * 1000;
  const otpSentAt = Date.now();

  // FIX #1 — Hash the password before persisting. Previously `password` was
  // stored as plaintext; now we store only the bcrypt hash.
  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await User.create({
    email,
    username,
    password: hashedPassword, // FIX #1 — Store hash, not raw password.
    isVerified: false,
    verificationOTP: hashedOtp,
    otpExpiresAt,
    otpSentAt,
  });

  try {
    await sendVerificationEmail(user.email, verificationOTP);
  } catch (mailError) {
    // FIX #10 — Log the real error internally for observability.
    console.error("[register] Failed to send verification email:", {
      userId: user._id,
      email: user.email,
      error: mailError?.message,
    });

    await User.deleteOne({ _id: user._id });
    throw new CustomError("Failed to send verification email.", 500);
  }

  // FIX #10 — Structured success log for monitoring / audit trail.
  console.info("[register] New user registered:", {
    userId: user._id,
    email: user.email,
    ip: clientIp,
    timestamp: new Date().toISOString(),
  });

  // FIX #7 — Do not echo back the email in the response; the client already
  // knows it. Returning it unnecessarily leaks confirmation that the address
  // is now in the system.
  res.status(201).json({
    success: true,
    requiresVerification: true,
    message: "Verification email sent.",
  });
};

module.exports = register;

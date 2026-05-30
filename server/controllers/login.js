const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const User = require("../models/users.js");
const CustomError = require("../errors/custom-error");
const { sendVerificationEmail } = require("./auth.js");

const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const LOCKOUT_MS = 30 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;

const checkRateLimit = (ip) => {
  const now = Date.now();
  const entry = loginAttempts.get(ip);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    loginAttempts.set(ip, { count: 0, windowStart: now, lockedUntil: null });
    return;
  }

  if (entry.lockedUntil && now < entry.lockedUntil) {
    const minutesLeft = Math.ceil((entry.lockedUntil - now) / 60000);
    throw new CustomError(
      `Too many failed attempts. Try again in ${minutesLeft} minute(s).`,
      429,
    );
  }
};

const recordFailedAttempt = (ip) => {
  const now = Date.now();
  const entry = loginAttempts.get(ip) || {
    count: 0,
    windowStart: now,
    lockedUntil: null,
  };
  entry.count++;
  if (entry.count >= MAX_ATTEMPTS) entry.lockedUntil = now + LOCKOUT_MS;
  loginAttempts.set(ip, entry);
};

const clearAttempts = (ip) => loginAttempts.delete(ip);

const login = async (req, res) => {
  const clientIp =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown";

  checkRateLimit(clientIp);

  const email = req.body.email?.trim().toLowerCase();
  const { password } = req.body;

  if (!email || !password) {
    throw new CustomError("Please enter all fields.", 400);
  }

  const user = await User.findOne({ email, isActive: true }).select(
    "+email +password +failedLoginAttempts +lockedUntil +refreshJti",
  );

  if (!user || !user.password) {
    recordFailedAttempt(clientIp);
    console.warn("[login] Failed attempt — user not found:", {
      email,
      ip: clientIp,
      timestamp: new Date().toISOString(),
    });
    throw new CustomError("Invalid credentials.", 401);
  }

  if (user.lockedUntil && user.lockedUntil > Date.now()) {
    const minutesLeft = Math.ceil((user.lockedUntil - Date.now()) / 60000);
    throw new CustomError(
      `Account temporarily locked. Try again in ${minutesLeft} minute(s).`,
      429,
    );
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    recordFailedAttempt(clientIp);
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    if (user.failedLoginAttempts >= MAX_ATTEMPTS) {
      user.lockedUntil = new Date(Date.now() + LOCKOUT_MS);
      user.failedLoginAttempts = 0;
    }
    await user.save();
    console.warn("[login] Failed attempt — wrong password:", {
      userId: user._id,
      ip: clientIp,
      failedAttempts: user.failedLoginAttempts,
      timestamp: new Date().toISOString(),
    });
    throw new CustomError("Invalid credentials.", 401);
  }

  user.failedLoginAttempts = 0;
  user.lockedUntil = null;
  clearAttempts(clientIp);

  if (!user.isVerified) {
    const otpFields = await User.findById(user._id).select(
      "+otpSentAt +verificationOTP +otpExpiresAt",
    );

    if (
      otpFields.otpSentAt &&
      Date.now() - otpFields.otpSentAt.getTime() < OTP_RESEND_COOLDOWN_MS
    ) {
      const secondsLeft = Math.ceil(
        (OTP_RESEND_COOLDOWN_MS -
          (Date.now() - otpFields.otpSentAt.getTime())) /
          1000,
      );
      await user.save(); // persist the reset counters
      return res.status(200).json({
        success: true,
        requiresVerification: true,
        message: `Verification email already sent. Please wait ${secondsLeft}s before requesting another.`,
      });
    }

    const verificationOTP = crypto.randomInt(100000, 1000000).toString();
    const hashedOtp = await bcrypt.hash(verificationOTP, 12);

    user.verificationOTP = hashedOtp;
    user.otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    user.otpSentAt = new Date();
    await user.save();

    try {
      await sendVerificationEmail(user.email, verificationOTP);
    } catch (mailError) {
      console.error("[login] Failed to send verification email:", {
        userId: user._id,
        error: mailError?.message,
      });
      throw new CustomError("Failed to send verification email.", 500);
    }

    return res.status(200).json({
      success: true,
      requiresVerification: true,
      message:
        "Profile verification required. A new verification code has been sent.",
    });
  }

  const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });

  // Generate and persist refreshJti so logout and token rotation work.
  const refreshJti = crypto.randomUUID();
  const newRefreshToken = jwt.sign(
    { userId: user._id, jti: refreshJti },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" },
  );

  user.refreshJti = refreshJti;
  await user.save();

  res.cookie("refreshToken", newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  console.info("[login] Successful login:", {
    userId: user._id,
    ip: clientIp,
    timestamp: new Date().toISOString(),
  });

  res.status(200).json({
    success: true,
    requiresVerification: false,
    accessToken,
    user: {
      id: user._id,
      username: user.username,
      image: user.image,
    },
  });
};

module.exports = login;

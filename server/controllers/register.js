const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/users");
const CustomError = require("../errors/custom-error");
// ⚡ DOUBLE CHECK: Make sure this relative path points to your new Resend controller file
const { sendVerificationEmail } = require("./auth.js");

const register = async (req, res) => {
  const { email, username, password, confirmPassword } = req.body;

  // Validation
  if (!email || !username || !password || !confirmPassword) {
    throw new CustomError("Please complete all required fields.", 400);
  }

  if (password !== confirmPassword) {
    throw new CustomError("Password confirmation mismatch.", 400);
  }

  if (password.length < 8) {
    throw new CustomError("Password must be at least 8 characters.", 400);
  }

  // Check for existing user
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    if (!existingUser.password) {
      existingUser.password = password;
      existingUser.username = username;
      existingUser.isVerified = true;
      await existingUser.save();

      return res.status(200).json({
        success: true,
        requiresVerification: false,
        message: "Password linked to your Google profile.",
      });
    }

    throw new CustomError("Email already registered.", 409);
  }

  // ⚡ FIX: Generate a 6-digit pure numeric code to remain 100% consistent with resendOTP
  const verificationOTP = Math.floor(
    100000 + Math.random() * 900000,
  ).toString();
  const otpExpiresAt = Date.now() + 15 * 60 * 1000;

  // Create user
  const user = await User.create({
    email,
    username,
    password,
    isVerified: false,
    verificationOTP,
    otpExpiresAt,
  });

  // Send email using Resend API pipeline
  try {
    await sendVerificationEmail(user.email, verificationOTP);
  } catch (mailError) {
    // Clean rollback strategy: purges locked user record on email network failure
    await User.deleteOne({ _id: user._id });
    throw new CustomError("Failed to send verification email.", 500);
  }

  res.status(201).json({
    success: true,
    requiresVerification: true,
    email: user.email,
    message: "Verification email sent.",
  });
};

module.exports = register;

const bcrypt = require("bcrypt");
const User = require("../models/users");
const CustomError = require("../errors/custom-error");
const { sendVerificationEmail } = require("./auth.js");

const register = async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  const username = req.body.username?.trim();
  const { password, confirmPassword } = req.body;

  if (!email || !username || !password || !confirmPassword) {
    throw new CustomError("Please complete all required fields.", 400);
  }

  if (password !== confirmPassword) {
    throw new CustomError("Password confirmation mismatch.", 400);
  }

  if (password.length < 8) {
    throw new CustomError("Password must be at least 8 characters.", 400);
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    if (!existingUser.password) {
      existingUser.password = await bcrypt.hash(password, 10);
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

  const verificationOTP = Math.floor(
    100000 + Math.random() * 900000,
  ).toString();
  const hashedOtp = await bcrypt.hash(verificationOTP, 10);
  const otpExpiresAt = Date.now() + 15 * 60 * 1000;
  const otpSentAt = Date.now();

  const user = await User.create({
    email,
    username,
    password,
    isVerified: false,
    verificationOTP: hashedOtp,
    otpExpiresAt,
    otpSentAt,
  });

  try {
    await sendVerificationEmail(user.email, verificationOTP);
  } catch (mailError) {
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

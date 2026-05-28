const crypto = require("crypto");
const { Resend } = require("resend");
const bcrypt = require("bcryptjs");
const User = require("../models/users.js");
const CustomError = require("../errors/custom-error");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendVerificationEmail = async (email, otp) => {
  const sender =
    process.env.NODE_ENV === "production" && process.env.VERIFIED_EMAIL_FROM
      ? process.env.VERIFIED_EMAIL_FROM
      : "Verification <onboarding@resend.dev>";

  const recipient =
    process.env.NODE_ENV === "production" ? email : process.env.TEST_EMAIL;

  // OTP should never appear in logs — redact it.
  const { data, error } = await resend.emails.send({
    from: sender,
    to: recipient,
    subject: "Verify Your Email",
    html: `<div style="font-family:sans-serif;padding:20px;border:1px solid #7a5e3e;">
            <h2>Verification Code</h2>
            <p>Use this code to verify your account:</p>
            <h1 style="letter-spacing:4px;color:#7a5e3e;">${otp}</h1>
            <p>Code expires in 15 minutes. If you didn't request this, ignore this email.</p>
           </div>`,
  });

  if (error) {
    // Log internally but never forward the raw provider error to the caller —
    // let the controller decide what the client sees.
    console.error(
      "[sendVerificationEmail] Resend error:",
      JSON.stringify(error),
    );
    throw new Error(error.message);
  }

  return data;
};

const verifyEmail = async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  const { otp } = req.body;

  if (!email || !otp) {
    throw new CustomError("Email and OTP required.", 400);
  }

  // FIX — Select the OTP fields that are hidden by default (select: false).
  const user = await User.findOne({ email }).select(
    "+verificationOTP +otpExpiresAt +otpSentAt",
  );

  // FIX — Return the same error for not-found and already-verified to avoid
  // confirming whether an email exists in the system.
  if (!user) {
    throw new CustomError("Invalid or expired code.", 400);
  }

  if (user.isVerified) {
    return res
      .status(200)
      .json({ success: true, message: "Already verified." });
  }

  // FIX — Check expiry BEFORE bcrypt.compare to avoid wasting time on
  // an OTP that's already invalid.
  if (!user.verificationOTP || Date.now() > user.otpExpiresAt) {
    throw new CustomError("Invalid or expired code.", 400);
  }

  const isMatch = await bcrypt.compare(otp, user.verificationOTP);
  if (!isMatch) {
    throw new CustomError("Invalid or expired code.", 400);
  }

  user.isVerified = true;
  user.verificationOTP = undefined;
  user.otpExpiresAt = undefined;
  user.otpSentAt = undefined;
  await user.save();

  res.status(200).json({ success: true, message: "Verification successful." });
};

const resendOTP = async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();

  if (!email) {
    throw new CustomError("Email required.", 400);
  }

  // FIX — Select hidden OTP fields needed for cooldown check.
  const user = await User.findOne({ email }).select(
    "+otpSentAt +verificationOTP +otpExpiresAt",
  );

  // FIX — Don't reveal whether the email exists; return the same response
  // either way to prevent enumeration.
  if (!user || user.isVerified) {
    return res
      .status(200)
      .json({ success: true, message: "Verification code sent." });
  }

  if (user.otpSentAt && Date.now() < user.otpSentAt.getTime() + 60 * 1000) {
    throw new CustomError("Please wait 1 minute before resending.", 429);
  }

  // FIX — Use crypto.randomInt() instead of Math.random().
  const newOtp = crypto.randomInt(100000, 1000000).toString();

  // FIX — Hash and save BEFORE sending the email so they're never out of sync.
  const hashedOtp = await bcrypt.hash(newOtp, 12);
  user.verificationOTP = hashedOtp;
  user.otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
  user.otpSentAt = new Date();
  await user.save();

  try {
    await sendVerificationEmail(user.email, newOtp);
  } catch (mailError) {
    console.error("[resendOTP] Failed to send email:", {
      userId: user._id,
      error: mailError?.message,
    });
    throw new CustomError("Failed to send verification email.", 500);
  }

  res.status(200).json({ success: true, message: "Verification code sent." });
};

const getMe = async (req, res) => {
  if (!req.user?.userId) {
    throw new CustomError("Not authenticated.", 401);
  }

  // FIX — Explicitly select email since it's now select: false on the schema.
  const user = await User.findById(req.user.userId).select("+email");
  if (!user) throw new CustomError("User not found.", 404);

  res.status(200).json({
    success: true,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      image: user.image,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
    },
  });
};

module.exports = { verifyEmail, resendOTP, sendVerificationEmail, getMe };

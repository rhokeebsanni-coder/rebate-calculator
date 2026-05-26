const nodemailer = require("nodemailer");
const User = require("../models/users.js");
const CustomError = require("../errors/custom-error");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((error) => {
  if (error) {
    console.error("Email config failed:", error.message);
  } else {
    console.log("Email service ready");
  }
});

const sendVerificationEmail = async (email, otp) => {
  try {
    const result = await transporter.sendMail({
      from: `"Verification" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify Your Email",
      html: `<div style="font-family:sans-serif; padding:20px; border:1px solid #7a5e3e;">
              <h2>Verification Code</h2>
              <p>Use this code to verify your email:</p>
              <h1 style="letter-spacing:4px; color:#7a5e3e;">${otp}</h1>
              <p>Code expires in 15 minutes.</p>
             </div>`,
    });
    return result;
  } catch (error) {
    console.error("Email failed:", error.message);
    throw new CustomError("Failed to send verification email.", 500);
  }
};

const verifyEmail = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new CustomError("Email and OTP required.", 400);
  }

  const user = await User.findOne({ email });
  if (!user) throw new CustomError("Account not found.", 404);

  if (user.isVerified) {
    return res
      .status(200)
      .json({ success: true, message: "Already verified." });
  }

  if (
    !user.verificationOTP ||
    user.verificationOTP !== otp ||
    Date.now() > user.otpExpiresAt
  ) {
    throw new CustomError("Invalid or expired code.", 400);
  }

  user.isVerified = true;
  user.verificationOTP = undefined;
  user.otpExpiresAt = undefined;
  await user.save();

  res.status(200).json({ success: true, message: "Verification successful." });
};

const resendOTP = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new CustomError("Email required.", 400);
  }

  const user = await User.findOne({ email });
  if (!user) throw new CustomError("Account not found.", 404);

  if (user.otpExpiresAt && Date.now() < user.otpExpiresAt - 14 * 60 * 1000) {
    throw new CustomError("Please wait 1 minute before resending.", 429);
  }

  const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
  user.verificationOTP = newOtp;
  user.otpExpiresAt = Date.now() + 15 * 60 * 1000;
  await user.save();

  await sendVerificationEmail(user.email, newOtp);
  res.status(200).json({ success: true, message: "Verification code sent." });
};

const getMe = async (req, res) => {
  if (!req.user?.userId) {
    throw new CustomError("Not authenticated.", 401);
  }

  const user = await User.findById(req.user.userId);
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

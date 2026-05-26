const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/users.js");
const CustomError = require("../errors/custom-error");
const { sendVerificationEmail } = require("./auth.js");

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new CustomError("Please enter all fields.", 400);
  }

  const user = await User.findOne({ email, isActive: true }).select(
    "+password",
  );

  if (!user || !user.password) {
    throw new CustomError("Invalid credentials.", 400);
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new CustomError("Invalid credentials.", 400);
  }

  if (!user.isVerified) {
    const verificationOTP = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();

    await sendVerificationEmail(user.email, verificationOTP);

    user.verificationOTP = verificationOTP;
    user.otpExpiresAt = Date.now() + 15 * 60 * 1000;
    await user.save();

    return res.status(200).json({
      success: true,
      requiresVerification: true,
      email: user.email,
      message:
        "Profile verification required before access. A new verification code has been sent.",
    });
  }

  const token = jwt.sign(
    {
      userId: user._id,
      email: user.email,
      username: user.username,
      image: user.image,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" },
  );

  res.status(200).json({
    success: true,
    requiresVerification: false,
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      image: user.image,
    },
  });
};

module.exports = login;

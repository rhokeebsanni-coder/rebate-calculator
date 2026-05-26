const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/users.js");
const CustomError = require("../errors/custom-error");

const login = async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    throw new CustomError("Please enter all fields.", 400);
  }

  // Find active user and fetch password hash
  const user = await User.findOne({ email, isActive: true }).select(
    "+password",
  );

  if (!user || !user.password) {
    throw new CustomError("Invalid credentials.", 400);
  }

  // Verify password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new CustomError("Invalid credentials.", 400);
  }

  // Check if verified
  if (!user.isVerified) {
    throw new CustomError("Profile verification required before access.", 403);
  }

  // Generate token
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

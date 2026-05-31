const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/users.js");
const { OAuth2Client } = require("google-auth-library");
const CustomError = require("../errors/custom-error.js");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleLogin = async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    throw new CustomError("No credential token provided.", 400);
  }

  let payload;
  try {
    const ticket = await client.verifyIdToken({ idToken: credential });
    payload = ticket.getPayload();
  } catch {
    throw new CustomError("Invalid or expired Google token.", 401);
  }

  const { sub, name, picture } = payload;
  const email = payload.email?.trim().toLowerCase();

  if (!sub || !email) {
    throw new CustomError("Invalid Google token.", 401);
  }

  let user = await User.findOne({ googleId: sub });

  if (!user) {
    user = await User.findOne({ email });

    if (user) {
      if (!user.isActive)
        throw new CustomError("Account has been deactivated.", 403);
      user.googleId = sub;
      user.isVerified = true;
      if (!user.image) user.image = picture;
      await user.save();
    } else {
      const baseUsername = name || email.split("@")[0];
      const existingUsername = await User.findOne({ username: baseUsername });
      const username = existingUsername
        ? `${baseUsername}_${Date.now()}`
        : baseUsername;

      user = await User.create({
        username,
        email,
        googleId: sub,
        image:
          picture || "https://cdn-icons-png.flaticon.com/512/847/847969.png",
        isVerified: true,
        isActive: true,
      });
    }
  }

  if (!user.isActive) {
    throw new CustomError("Account has been deactivated.", 403);
  }

  const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });

  const refreshJti = crypto.randomUUID();
  const newRefreshToken = jwt.sign(
    { userId: user._id, jti: refreshJti },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" },
  );

  user.refreshJti = refreshJti;
  await user.save();

  

  res.status(200).json({
    success: true,
    accessToken,
    refreshToken: newRefreshToken, // ← send in body
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      image: user.image,
    },
  });
};

module.exports = googleLogin;

const jwt = require("jsonwebtoken");
const User = require("../models/users.js");
const { OAuth2Client } = require("google-auth-library");
const CustomError = require("../errors/custom-error.js");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleLogin = async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    throw new CustomError("No credential token provided.", 400);
  }

  const ticket = await client.verifyIdToken({ idToken: credential });
  const payload = ticket.getPayload();
  const { sub, email, name, picture } = payload;

  if (!sub || !email) {
    throw new CustomError("Invalid Google token.", 401);
  }

  let user = await User.findOne({ googleId: sub });

  if (!user) {
    user = await User.findOne({ email });

    if (user) {
      // Link Google to existing account
      user.googleId = sub;
      user.isVerified = true;
      if (!user.image) user.image = picture;
      await user.save();
    } else {
      // Create new Google user
      user = await User.create({
        username: name || email.split("@")[0],
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

  // Generate token and return it
  const token = jwt.sign(
    {
      userId: user._id,
      username: user.username,
      email: user.email,
      image: user.image,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" },
  );

  res.status(200).json({
    success: true,
    token, // ✅ RETURN TOKEN
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      image: user.image,
    },
  });
};

module.exports = googleLogin;

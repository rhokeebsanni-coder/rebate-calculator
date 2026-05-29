const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware.js");

const login = require("../controllers/login.js");
const register = require("../controllers/register.js");
const googleLogin = require("../controllers/googleLogin.js");
const { refreshToken, logout } = require("../controllers/refreshToken.js");
const { verifyEmail, resendOTP, getMe } = require("../controllers/auth.js");

// Public routes
router.post("/login",login);
router.post("/register",register);
router.post("/google",googleLogin);
router.post("/verify-email",verifyEmail);
router.post("/resend-otp",resendOTP);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);


// Protected routes
router.get("/me", authMiddleware, getMe);

module.exports = router;

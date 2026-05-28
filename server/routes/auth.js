const express = require("express");
const router = express.Router();

const asyncHandler = require("../middleware/asyncHandler.js");
const authMiddleware = require("../middleware/authMiddleware.js");

const login = require("../controllers/login.js");
const register = require("../controllers/register.js");
const googleLogin = require("../controllers/googleLogin.js");
const { refreshToken, logout } = require("../controllers/refreshToken.js");
const { verifyEmail, resendOTP, getMe } = require("../controllers/auth.js");

// Public routes
router.post("/login", asyncHandler(login));
router.post("/register", asyncHandler(register));
router.post("/google", asyncHandler(googleLogin));
router.post("/verify-email", asyncHandler(verifyEmail));
router.post("/resend-otp", asyncHandler(resendOTP));
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);


// Protected routes
router.get("/me", authMiddleware, asyncHandler(getMe));

module.exports = router;

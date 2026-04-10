const express = require("express");
const authController = require("../controllers/authController");
const asyncHandler = require("../utils/asyncHandler");
const { authenticate } = require("../middleware/auth");
const { authLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

// router.post("/register", authLimiter, asyncHandler(authController.register));
// router.post("/login", authLimiter, asyncHandler(authController.login));
// router.post("/google", authLimiter, asyncHandler(authController.googleLogin));
router.post("/register", asyncHandler(authController.register));
router.post("/login", asyncHandler(authController.login));
router.post("/google", asyncHandler(authController.googleLogin));
router.post("/logout", authenticate, asyncHandler(authController.logout));

module.exports = router;

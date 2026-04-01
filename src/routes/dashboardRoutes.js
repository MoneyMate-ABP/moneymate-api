const express = require("express");
const dashboardController = require("../controllers/dashboardController");
const asyncHandler = require("../utils/asyncHandler");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.get("/", authenticate, asyncHandler(dashboardController.getDashboard));

module.exports = router;

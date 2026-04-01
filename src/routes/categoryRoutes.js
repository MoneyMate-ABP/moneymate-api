const express = require("express");
const categoryController = require("../controllers/categoryController");
const asyncHandler = require("../utils/asyncHandler");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.get("/", authenticate, asyncHandler(categoryController.listCategories));

module.exports = router;

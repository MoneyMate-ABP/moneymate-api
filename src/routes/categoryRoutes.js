const express = require("express");
const categoryController = require("../controllers/categoryController");
const asyncHandler = require("../utils/asyncHandler");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.use(authenticate);

router.get("/", asyncHandler(categoryController.listCategories));
router.get("/:id", asyncHandler(categoryController.getCategoryById));
router.post("/", asyncHandler(categoryController.createCategory));
router.put("/:id", asyncHandler(categoryController.updateCategory));
router.delete("/:id", asyncHandler(categoryController.deleteCategory));

module.exports = router;

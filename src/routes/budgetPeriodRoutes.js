const express = require("express");
const budgetPeriodController = require("../controllers/budgetPeriodController");
const asyncHandler = require("../utils/asyncHandler");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.get(
  "/",
  authenticate,
  asyncHandler(budgetPeriodController.listBudgetPeriods),
);
router.post(
  "/",
  authenticate,
  asyncHandler(budgetPeriodController.createBudgetPeriod),
);
router.put(
  "/:id",
  authenticate,
  asyncHandler(budgetPeriodController.updateBudgetPeriod),
);
router.delete(
  "/:id",
  authenticate,
  asyncHandler(budgetPeriodController.deleteBudgetPeriod),
);
router.get(
  "/:id/daily-status",
  authenticate,
  asyncHandler(budgetPeriodController.getBudgetDailyStatus),
);

module.exports = router;

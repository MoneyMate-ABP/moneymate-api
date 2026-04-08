const express = require("express");
const transactionController = require("../controllers/transactionController");
const asyncHandler = require("../utils/asyncHandler");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.get(
  "/",
  authenticate,
  asyncHandler(transactionController.listTransactions),
);
router.get(
  "/:id",
  authenticate,
  asyncHandler(transactionController.getTransactionById),
);
router.post(
  "/",
  authenticate,
  asyncHandler(transactionController.createTransaction),
);
router.put(
  "/:id",
  authenticate,
  asyncHandler(transactionController.updateTransaction),
);
router.delete(
  "/:id",
  authenticate,
  asyncHandler(transactionController.deleteTransaction),
);

module.exports = router;

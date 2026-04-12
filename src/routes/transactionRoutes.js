const express = require("express");
const multer = require("multer");
const transactionController = require("../controllers/transactionController");
const asyncHandler = require("../utils/asyncHandler");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

const receiptMaxFileSizeMb = Math.max(
  1,
  Number(process.env.RECEIPT_MAX_FILE_SIZE_MB || 10),
);
const receiptMaxFileSizeBytes = Math.floor(receiptMaxFileSizeMb * 1024 * 1024);

const receiptUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: receiptMaxFileSizeBytes,
  },
  fileFilter: (req, file, cb) => {
    const mimeType = String(file.mimetype || "").toLowerCase();
    const isPdf = mimeType === "application/pdf";
    const isImage = mimeType.startsWith("image/");

    if (isPdf || isImage) {
      return cb(null, true);
    }

    const error = new Error(
      "Unsupported receipt file type. Use image formats or PDF.",
    );
    error.statusCode = 400;
    return cb(error);
  },
});

function receiptUploadMiddleware(req, res, next) {
  receiptUpload.single("receipt")(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error.code === "LIMIT_FILE_SIZE") {
      error.statusCode = 400;
      error.message = `Receipt file is too large. Maximum size is ${receiptMaxFileSizeMb}MB.`;
    }

    return next(error);
  });
}

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
router.post(
  "/receipt-scan",
  authenticate,
  receiptUploadMiddleware,
  asyncHandler(transactionController.scanReceipt),
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

const express = require("express");
const notificationController = require("../controllers/notificationController");
const asyncHandler = require("../utils/asyncHandler");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.get(
  "/vapid-key",
  asyncHandler(notificationController.getPublicVapidKey),
);
router.post(
  "/subscribe",
  authenticate,
  asyncHandler(notificationController.subscribe),
);
router.delete(
  "/unsubscribe",
  authenticate,
  asyncHandler(notificationController.unsubscribe),
);
router.get(
  "/history",
  authenticate,
  asyncHandler(notificationController.getHistory),
);
router.patch(
  "/history/read-all",
  authenticate,
  asyncHandler(notificationController.markAllHistoryRead),
);
router.patch(
  "/history/:id/read",
  authenticate,
  asyncHandler(notificationController.markHistoryRead),
);

module.exports = router;

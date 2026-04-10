const { z } = require("zod");
const {
  deletePushSubscription,
  getVapidPublicKey,
  getNotificationHistory,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  upsertPushSubscription,
} = require("../services/pushService");

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

const unsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

const historyIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

async function getPublicVapidKey(_req, res) {
  const publicKey = getVapidPublicKey();

  if (!publicKey) {
    return res.status(503).json({
      message: "VAPID public key is not configured.",
    });
  }

  return res.json({
    publicKey,
  });
}

async function subscribe(req, res) {
  const payload = req.body?.subscription ?? req.body;
  const subscription = subscriptionSchema.parse(payload);

  await upsertPushSubscription(req.user.id, subscription);

  return res.status(201).json({
    message: "Push subscription saved.",
  });
}

async function unsubscribe(req, res) {
  const payload = unsubscribeSchema.parse(req.body);
  const deleted = await deletePushSubscription(req.user.id, payload.endpoint);

  if (!deleted) {
    return res.status(404).json({
      message: "Push subscription not found.",
    });
  }

  return res.json({
    message: "Push subscription removed.",
  });
}

async function getHistory(req, res) {
  const data = await getNotificationHistory(req.user.id, 5);
  const unreadCount = await getUnreadNotificationCount(req.user.id);

  return res.json({
    data,
    unread_count: unreadCount,
  });
}

async function markHistoryRead(req, res) {
  const { id } = historyIdSchema.parse(req.params);
  const updated = await markNotificationAsRead(req.user.id, id);

  if (!updated) {
    return res.status(404).json({
      message: "Notification history not found.",
    });
  }

  return res.json({
    message: "Notification marked as read.",
  });
}

async function markAllHistoryRead(req, res) {
  await markAllNotificationsAsRead(req.user.id);

  return res.json({
    message: "All notifications marked as read.",
  });
}

module.exports = {
  getHistory,
  getPublicVapidKey,
  markAllHistoryRead,
  markHistoryRead,
  subscribe,
  unsubscribe,
};

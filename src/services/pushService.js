const webpush = require("web-push");
const db = require("../config/db");
const env = require("../config/env");
const {
  isWeekend,
  listDatesInclusive,
  parseDate,
  toDateString,
} = require("../utils/date");
const { roundTo2, toNumber } = require("../utils/number");

let vapidConfigured = false;

function getVapidPublicKey() {
  return env.vapidPublicKey || "";
}

function isVapidConfigured() {
  return Boolean(env.vapidPublicKey && env.vapidPrivateKey && env.vapidMailto);
}

function ensureVapidDetails() {
  if (vapidConfigured) {
    return true;
  }

  if (!isVapidConfigured()) {
    return false;
  }

  webpush.setVapidDetails(
    env.vapidMailto,
    env.vapidPublicKey,
    env.vapidPrivateKey,
  );

  vapidConfigured = true;
  return true;
}

async function upsertPushSubscription(userId, subscription) {
  const endpoint = String(subscription.endpoint || "").trim();
  const p256dh = String(subscription.keys?.p256dh || "").trim();
  const auth = String(subscription.keys?.auth || "").trim();

  const existing = await db("push_subscriptions")
    .where({ user_id: userId, endpoint })
    .first();

  if (existing) {
    await db("push_subscriptions")
      .where({ id: existing.id })
      .update({ p256dh, auth });

    return existing.id;
  }

  const [inserted] = await db("push_subscriptions")
    .insert({
      user_id: userId,
      endpoint,
      p256dh,
      auth,
    })
    .returning("id");

  if (inserted && typeof inserted === "object") {
    return inserted.id;
  }

  return inserted || null;
}

async function deletePushSubscription(userId, endpoint) {
  return db("push_subscriptions")
    .where({ user_id: userId, endpoint: String(endpoint || "").trim() })
    .delete();
}

async function getActiveUserIdsWithSubscriptions() {
  const rows = await db("push_subscriptions").distinct("user_id");
  return rows
    .map((row) => Number(row.user_id))
    .filter((id) => Number.isInteger(id));
}

async function getActiveBudgetPeriodsForDate(userId, dateString) {
  return db("budget_periods")
    .where({ user_id: userId })
    .andWhere("start_date", "<=", dateString)
    .andWhere("end_date", ">=", dateString)
    .select(
      "id",
      "user_id",
      "name",
      "category_id",
      "start_date",
      "end_date",
      "daily_budget_base",
    );
}

async function createNotificationHistory({
  userId,
  title,
  body,
  budgetPeriodName,
  effectiveBudget,
  carryOver,
}) {
  await db("notification_histories").insert({
    user_id: userId,
    title,
    body,
    budget_period_name: budgetPeriodName || null,
    effective_budget: roundTo2(effectiveBudget),
    carry_over: roundTo2(carryOver),
    is_read: false,
    sent_at: new Date(),
  });
}

async function getSpentMapByDate({ userId, categoryId, startDate, endDate }) {
  const query = db("transactions")
    .select("date")
    .sum({ total: "amount" })
    .where({
      user_id: userId,
      type: "expense",
    })
    .andWhere("date", ">=", toDateString(startDate))
    .andWhere("date", "<=", toDateString(endDate));

  if (categoryId) {
    query.andWhere("category_id", categoryId);
  }

  const rows = await query.groupBy("date");

  const spentMap = new Map();
  for (const row of rows) {
    spentMap.set(toDateString(parseDate(row.date)), toNumber(row.total));
  }

  return spentMap;
}

async function calculateEffectiveBudgetForToday(period, todayDate) {
  const startDate = parseDate(period.start_date, "start_date");
  const today = parseDate(todayDate, "today");
  const targetDateString = toDateString(today);
  const dailyBase = toNumber(period.daily_budget_base);

  const spentMap = await getSpentMapByDate({
    userId: period.user_id,
    categoryId: period.category_id,
    startDate,
    endDate: today,
  });

  let carryOver = 0;
  let carryOverBeforeTarget = 0;
  let effectiveBudgetForTarget = 0;

  for (const day of listDatesInclusive(startDate, today)) {
    const dayString = toDateString(day);
    const base = isWeekend(day) ? 0 : dailyBase;
    const effectiveBudget = roundTo2(base + carryOver);
    const spentThatDay = roundTo2(spentMap.get(dayString) || 0);

    if (dayString === targetDateString) {
      carryOverBeforeTarget = roundTo2(carryOver);
      effectiveBudgetForTarget = effectiveBudget;
    }

    carryOver = roundTo2(effectiveBudget - spentThatDay);
  }

  return {
    effectiveBudget: effectiveBudgetForTarget,
    carryOverFromYesterday: carryOverBeforeTarget,
  };
}

function formatRupiah(amount) {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(roundTo2(amount));
}

function buildNotificationPayload(totalEffectiveBudget, totalCarryOver) {
  const carryLabel =
    totalCarryOver === 0
      ? "impas"
      : `${totalCarryOver > 0 ? "surplus" : "deficit"} Rp ${formatRupiah(Math.abs(totalCarryOver))}`;

  return {
    title: "Budget hari ini siap!",
    body: `Budget efektif kamu hari ini: Rp ${formatRupiah(totalEffectiveBudget)} (${carryLabel} dari kemarin)`,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
  };
}

async function deleteSubscriptionById(id) {
  await db("push_subscriptions").where({ id }).delete();
}

async function sendToUserSubscriptions(userId, payload) {
  const subscriptions = await db("push_subscriptions")
    .where({ user_id: userId })
    .select("id", "endpoint", "p256dh", "auth");

  for (const subscription of subscriptions) {
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    };

    try {
      await webpush.sendNotification(pushSubscription, JSON.stringify(payload));
    } catch (error) {
      if (error.statusCode === 404 || error.statusCode === 410) {
        await deleteSubscriptionById(subscription.id);
        continue;
      }

      console.error(
        `[MoneyMate] Failed to send push notification to subscription ${subscription.id}:`,
        error.message,
      );
    }
  }
}

async function getNotificationHistory(userId, limit = 5) {
  const rows = await db("notification_histories")
    .where({ user_id: userId })
    .orderBy("sent_at", "desc")
    .limit(limit)
    .select(
      "id",
      "title",
      "body",
      "budget_period_name",
      "effective_budget",
      "carry_over",
      "is_read",
      "sent_at",
    );

  return rows.map((row) => ({
    ...row,
    effective_budget: toNumber(row.effective_budget),
    carry_over: toNumber(row.carry_over),
    is_read: Boolean(row.is_read),
  }));
}

async function getUnreadNotificationCount(userId) {
  const summary = await db("notification_histories")
    .where({ user_id: userId, is_read: false })
    .count({ total: "id" })
    .first();

  return Number(summary?.total || 0);
}

async function markNotificationAsRead(userId, notificationId) {
  return db("notification_histories")
    .where({ id: notificationId, user_id: userId })
    .update({ is_read: true });
}

async function markAllNotificationsAsRead(userId) {
  return db("notification_histories")
    .where({ user_id: userId, is_read: false })
    .update({ is_read: true });
}

async function sendDailyBudgetNotifications() {
  if (!ensureVapidDetails()) {
    console.warn(
      "[MoneyMate] Daily budget push job skipped because VAPID keys are not fully configured.",
    );
    return;
  }

  const todayString = toDateString(new Date());
  const userIds = await getActiveUserIdsWithSubscriptions();

  for (const userId of userIds) {
    const activePeriods = await getActiveBudgetPeriodsForDate(
      userId,
      todayString,
    );

    if (!activePeriods.length) {
      continue;
    }

    let totalEffectiveBudget = 0;
    let totalCarryOverFromYesterday = 0;

    for (const period of activePeriods) {
      const status = await calculateEffectiveBudgetForToday(
        period,
        todayString,
      );
      totalEffectiveBudget = roundTo2(
        totalEffectiveBudget + status.effectiveBudget,
      );
      totalCarryOverFromYesterday = roundTo2(
        totalCarryOverFromYesterday + status.carryOverFromYesterday,
      );
    }

    const periodNames = activePeriods
      .map((period) => String(period.name || "").trim())
      .filter(Boolean)
      .join(", ");

    const payload = buildNotificationPayload(
      totalEffectiveBudget,
      totalCarryOverFromYesterday,
    );

    try {
      await sendToUserSubscriptions(userId, payload);
    } catch (error) {
      console.error(
        `[MoneyMate] Push delivery encountered an error for user ${userId}:`,
        error.message,
      );
    }

    await createNotificationHistory({
      userId,
      title: payload.title,
      body: payload.body,
      budgetPeriodName: periodNames,
      effectiveBudget: totalEffectiveBudget,
      carryOver: totalCarryOverFromYesterday,
    });
  }
}

module.exports = {
  deletePushSubscription,
  getVapidPublicKey,
  getNotificationHistory,
  getUnreadNotificationCount,
  isVapidConfigured,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  sendDailyBudgetNotifications,
  upsertPushSubscription,
};

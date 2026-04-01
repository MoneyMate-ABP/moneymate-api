const cron = require("node-cron");
const db = require("../config/db");
const env = require("../config/env");

let task;

function startDailyNotificationJob() {
  if (task) {
    return task;
  }

  task = cron.schedule(
    "0 20 * * *",
    async () => {
      const userCountSummary = await db("users").count({ total: "id" }).first();
      const userCount = Number(userCountSummary.total || 0);

      // Baseline notification hook; integrate push/email/WhatsApp provider here.
      console.log(
        `[MoneyMate] 20:00 daily budget reminder triggered for ${userCount} users.`,
      );
    },
    {
      timezone: env.appTimezone,
    },
  );

  return task;
}

module.exports = {
  startDailyNotificationJob,
};

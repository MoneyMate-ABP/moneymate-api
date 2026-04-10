const cron = require("node-cron");
const { sendDailyBudgetNotifications } = require("../services/pushService");

let task;

function startDailyBudgetNotificationJob() {
  if (task) {
    return task;
  }

  task = cron.schedule("0 8 * * *", async () => {
    try {
      await sendDailyBudgetNotifications();
      console.log(
        "[MoneyMate] 08:00 daily budget push notification job executed.",
      );
    } catch (error) {
      console.error(
        "[MoneyMate] Daily budget push notification job failed:",
        error,
      );
    }
  });

  return task;
}

module.exports = {
  startDailyBudgetNotificationJob,
};

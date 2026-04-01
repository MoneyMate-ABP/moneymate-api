const app = require("./app");
const db = require("./config/db");
const { ensureDatabaseExists } = require("./config/ensureDatabaseExists");
const env = require("./config/env");
const { migrateDatabase } = require("./config/migrateDatabase");
const { startDailyNotificationJob } = require("./jobs/dailyNotificationJob");

async function startServer() {
  await ensureDatabaseExists();
  await migrateDatabase();
  startDailyNotificationJob();

  app.listen(env.port, () => {
    console.log(`MoneyMate API running on port ${env.port}`);
  });
}

startServer().catch(async (error) => {
  console.error("Failed to start server:", error);
  await db.destroy();
  process.exit(1);
});

async function gracefulShutdown(signal) {
  try {
    console.log(`Received ${signal}. Closing database pool...`);
    await db.destroy();
    process.exit(0);
  } catch (error) {
    console.error("Error during shutdown:", error);
    process.exit(1);
  }
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

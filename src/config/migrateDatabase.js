const db = require("./db");

async function migrateDatabase() {
  const [batchNo, log] = await db.migrate.latest({
    directory: "./src/database/migrations",
    tableName: "knex_migrations",
  });

  if (log.length > 0) {
    console.log(`Database migrated (batch ${batchNo}): ${log.join(", ")}`);
  } else {
    console.log("Database schema is up to date.");
  }
}

module.exports = {
  migrateDatabase,
};

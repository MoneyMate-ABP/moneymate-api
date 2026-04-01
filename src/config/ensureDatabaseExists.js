const knex = require("knex");
const env = require("./env");

function quoteIdentifier(identifier) {
  return `"${String(identifier).replace(/"/g, '""')}"`;
}

async function ensurePostgresDatabaseExists() {
  const adminDb = knex({
    client: "pg",
    connection: {
      host: env.dbHost,
      port: env.dbPort,
      user: env.dbUser,
      password: env.dbPassword,
      database: "postgres",
    },
  });

  try {
    const result = await adminDb("pg_database")
      .select("datname")
      .where({ datname: env.dbName })
      .first();

    if (!result) {
      await adminDb.raw(`CREATE DATABASE ${quoteIdentifier(env.dbName)}`);
      console.log(`Database created: ${env.dbName}`);
    }
  } finally {
    await adminDb.destroy();
  }
}

async function ensureMySqlDatabaseExists() {
  const adminDb = knex({
    client: "mysql2",
    connection: {
      host: env.dbHost,
      port: env.dbPort,
      user: env.dbUser,
      password: env.dbPassword,
    },
  });

  try {
    const [rows] = await adminDb.raw(
      "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?",
      [env.dbName],
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      await adminDb.raw("CREATE DATABASE ??", [env.dbName]);
      console.log(`Database created: ${env.dbName}`);
    }
  } finally {
    await adminDb.destroy();
  }
}

async function ensureDatabaseExists() {
  if (env.dbDialect === "postgres" || env.dbDialect === "postgresql") {
    await ensurePostgresDatabaseExists();
    return;
  }

  if (env.dbDialect === "mysql") {
    await ensureMySqlDatabaseExists();
    return;
  }

  throw new Error(
    `Unsupported DB_DIALECT: ${env.dbDialect}. Use postgresql or mysql.`,
  );
}

module.exports = {
  ensureDatabaseExists,
};

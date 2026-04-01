const knex = require("knex");
const env = require("./env");

const DIALECT_TO_CLIENT = {
  postgres: "pg",
  postgresql: "pg",
  mysql: "mysql2",
};

const client = DIALECT_TO_CLIENT[env.dbDialect];

if (!client) {
  throw new Error(
    `Unsupported DB_DIALECT: ${env.dbDialect}. Use postgresql or mysql.`,
  );
}

const db = knex({
  client,
  connection: {
    host: env.dbHost,
    port: env.dbPort,
    user: env.dbUser,
    password: env.dbPassword,
    database: env.dbName,
  },
  pool: {
    min: 2,
    max: 10,
  },
});

module.exports = db;

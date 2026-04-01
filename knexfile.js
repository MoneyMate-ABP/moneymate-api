const env = require("./src/config/env");

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

module.exports = {
  development: {
    client,
    connection: {
      host: env.dbHost,
      port: env.dbPort,
      user: env.dbUser,
      password: env.dbPassword,
      database: env.dbName,
    },
    migrations: {
      directory: "./src/database/migrations",
      tableName: "knex_migrations",
    },
    seeds: {
      directory: "./src/database/seeds",
    },
  },
};

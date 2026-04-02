const dotenv = require("dotenv");

dotenv.config();

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 3000),
  jwtSecret: process.env.JWT_SECRET || "replace-me-in-production",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
  firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY,
  appTimezone: process.env.APP_TIMEZONE || "Asia/Jakarta",
  dbDialect: process.env.DB_DIALECT || "postgresql",
  dbHost: process.env.DB_HOST || "localhost",
  dbPort: Number(process.env.DB_PORT || 5432),
  dbUser: process.env.DB_USER || "postgres",
  dbPassword: process.env.DB_PASSWORD,
  dbName: process.env.DB_NAME || "moneymate",
};

module.exports = env;

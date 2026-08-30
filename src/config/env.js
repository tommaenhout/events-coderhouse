import dotenv from "dotenv";

dotenv.config({ quiet: true });

const nodeEnv = process.env.NODE_ENV || "development";
const port = Number(process.env.PORT || 8080);
const jwtCookieExpiresIn = Number(
  process.env.JWT_COOKIE_EXPIRES_IN || 3_600_000,
);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT debe ser un número entero entre 1 y 65535");
}

if (!Number.isFinite(jwtCookieExpiresIn) || jwtCookieExpiresIn <= 0) {
  throw new Error("JWT_COOKIE_EXPIRES_IN debe ser un número positivo");
}

if (
  nodeEnv === "production" &&
  (!process.env.MONGO_URL || !process.env.JWT_SECRET)
) {
  throw new Error(
    "MONGO_URL y JWT_SECRET son obligatorias cuando NODE_ENV=production",
  );
}

export const env = Object.freeze({
  port,
  nodeEnv,
  mongoUrl:
    process.env.MONGO_URL ||
    "mongodb://127.0.0.1:27017/events-coderhouse",
  mongoDbName: process.env.MONGO_DB_NAME || "events",
  jwtSecret: process.env.JWT_SECRET || "development-only-secret",
  jwtRefreshSecret:
    process.env.JWT_REFRESH_SECRET || "development-only-refresh-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1h",
  jwtCookieExpiresIn,
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
});

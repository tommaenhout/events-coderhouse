import dotenv from "dotenv";

dotenv.config({ quiet: true });

export const createEnv = (source = process.env) =>
  Object.freeze({
    port: Number(source.PORT || 8080),
    nodeEnv: source.NODE_ENV || "development",
    mongoUrl:
      source.MONGO_URL || "mongodb://127.0.0.1:27017/events-coderhouse",
    mongoDbName: source.MONGO_DB_NAME || "events",
    jwtSecret: source.JWT_SECRET || "development-only-secret",
    jwtRefreshSecret:
      source.JWT_REFRESH_SECRET || "development-only-refresh-secret",
    jwtExpiresIn: source.JWT_EXPIRES_IN || "1h",
    jwtCookieExpiresIn: Number(source.JWT_COOKIE_EXPIRES_IN || 3_600_000),
    jwtRefreshExpiresIn: source.JWT_REFRESH_EXPIRES_IN || "7d",
  });

export const validateEnv = (config, source = process.env) => {
  if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535) {
    throw new Error("PORT debe ser un número entero entre 1 y 65535");
  }

  if (
    !Number.isFinite(config.jwtCookieExpiresIn) ||
    config.jwtCookieExpiresIn <= 0
  ) {
    throw new Error("JWT_COOKIE_EXPIRES_IN debe ser un número positivo");
  }

  if (config.nodeEnv === "production" && (!source.MONGO_URL || !source.JWT_SECRET)) {
    throw new Error(
      "MONGO_URL y JWT_SECRET son obligatorias cuando NODE_ENV=production",
    );
  }

  return config;
};

export const env = createEnv();

import assert from "node:assert/strict";
import test from "node:test";

import { createEnv, validateEnv } from "../src/config/env.js";

test("environment configuration is parsed without validating during import", () => {
  const config = createEnv({
    NODE_ENV: "test",
    PORT: "invalid",
    JWT_COOKIE_EXPIRES_IN: "invalid",
  });

  assert.equal(config.nodeEnv, "test");
  assert.equal(Number.isNaN(config.port), true);
  assert.equal(Number.isNaN(config.jwtCookieExpiresIn), true);
});

test("environment validation runs explicitly at application startup", () => {
  assert.throws(
    () => validateEnv(createEnv({ PORT: "invalid" }), {}),
    /PORT debe ser un número entero entre 1 y 65535/,
  );

  assert.throws(
    () =>
      validateEnv(
        createEnv({ PORT: "8080", JWT_COOKIE_EXPIRES_IN: "0" }),
        {},
      ),
    /JWT_COOKIE_EXPIRES_IN debe ser un número positivo/,
  );

  const productionSource = {
    NODE_ENV: "production",
    PORT: "8080",
    JWT_COOKIE_EXPIRES_IN: "3600000",
  };
  assert.throws(
    () => validateEnv(createEnv(productionSource), productionSource),
    /MONGO_URL y JWT_SECRET son obligatorias/,
  );
});

test("valid environment configuration is returned unchanged", () => {
  const source = {
    NODE_ENV: "production",
    PORT: "3000",
    MONGO_URL: "mongodb://database.test/events",
    JWT_SECRET: "secret",
    JWT_COOKIE_EXPIRES_IN: "60000",
  };
  const config = createEnv(source);

  assert.equal(validateEnv(config, source), config);
});

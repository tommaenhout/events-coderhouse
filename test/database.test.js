import assert from "node:assert/strict";
import test from "node:test";

import { createDatabase } from "../src/config/database.js";

test("database uses the injected MongoDB client", async () => {
  const calls = [];
  const client = {
    async connect(url, options) {
      calls.push(["connect", url, options]);
    },
    async disconnect() {
      calls.push(["disconnect"]);
    },
  };
  const logger = { log() {} };
  const database = createDatabase({
    client,
    mongoUrl: "mongodb://database.test",
    dbName: "events",
    logger,
  });

  await database.connect();
  await database.disconnect();

  assert.deepEqual(calls, [
    [
      "connect",
      "mongodb://database.test",
      { dbName: "events", serverSelectionTimeoutMS: 10_000 },
    ],
    ["disconnect"],
  ]);
});

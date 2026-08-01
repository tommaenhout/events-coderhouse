import assert from "node:assert/strict";
import test from "node:test";

import { startApplication } from "../src/startApplication.js";

test("application startup and shutdown are injected and idempotent", async () => {
  const calls = [];
  const server = {
    listening: true,
    close(callback) {
      calls.push(["server.close"]);
      this.listening = false;
      callback();
    },
  };
  const app = {
    listen(port, callback) {
      calls.push(["app.listen", port]);
      callback();
      return server;
    },
  };
  const database = {
    async connect() {
      calls.push(["database.connect"]);
    },
    async disconnect() {
      calls.push(["database.disconnect"]);
    },
  };
  const logger = { log() {} };

  const application = await startApplication({
    app,
    database,
    port: 8080,
    logger,
  });
  await Promise.all([application.stop(), application.stop()]);

  assert.deepEqual(calls, [
    ["database.connect"],
    ["app.listen", 8080],
    ["server.close"],
    ["database.disconnect"],
  ]);
});

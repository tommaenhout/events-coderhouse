import assert from "node:assert/strict";
import test from "node:test";

import { createSessionsService } from "../src/services/sessions.service.js";

test("sessions service returns the initial empty collection", () => {
  const sessionsService = createSessionsService();

  assert.deepEqual(sessionsService.getSessions(), []);
});

import assert from "node:assert/strict";
import test from "node:test";

import { createSessionsController } from "../src/controllers/sessions.controller.js";

const createResponse = () => {
  const result = {};
  return {
    result,
    response: {
      status(statusCode) {
        result.statusCode = statusCode;
        return this;
      },
      json(body) {
        result.body = body;
      },
    },
  };
};

test("sessions controller uses the injected service", async () => {
  const sessions = [{ id: "placeholder" }];
  const sessionsService = { getSessions: async () => sessions };
  const controller = createSessionsController({ sessionsService });
  const { response, result } = createResponse();

  await controller.getSessions({}, response, assert.fail);

  assert.deepEqual(result, {
    statusCode: 200,
    body: { status: "success", payload: sessions },
  });
});

test("sessions controller forwards service errors", async () => {
  const expectedError = new Error("unexpected");
  const sessionsService = {
    async getSessions() {
      throw expectedError;
    },
  };
  const controller = createSessionsController({ sessionsService });
  let forwardedError;

  await controller.getSessions({}, {}, (error) => {
    forwardedError = error;
  });

  assert.equal(forwardedError, expectedError);
});

import assert from "node:assert/strict";
import test from "node:test";

import { register } from "../src/controllers/sessions.controller.js";
import { SessionValidationError } from "../src/errors/sessions.errors.js";
import { UserEmailConflictError } from "../src/errors/users.errors.js";
import sessionsService from "../src/services/sessions.service.js";

const createResponse = () => {
  const result = {};
  return {
    result,
    response: {
      status(code) {
        result.statusCode = code;
        return this;
      },
      json(body) {
        result.body = body;
      },
    },
  };
};

test("register controller returns a created user", async (context) => {
  const original = sessionsService.register;
  sessionsService.register = async () => ({ _id: "new" });
  context.after(() => {
    sessionsService.register = original;
  });
  const { response, result } = createResponse();

  await register({ body: {} }, response, assert.fail);

  assert.equal(result.statusCode, 201);
  assert.deepEqual(result.body.payload, { _id: "new" });
});

test("register controller maps duplicate email to 409", async (context) => {
  const original = sessionsService.register;
  sessionsService.register = async () => {
    throw new UserEmailConflictError();
  };
  context.after(() => {
    sessionsService.register = original;
  });
  const { response, result } = createResponse();

  await register({ body: {} }, response, assert.fail);

  assert.equal(result.statusCode, 409);
});

test("register controller returns validation feedback in Spanish", async (context) => {
  const original = sessionsService.register;
  sessionsService.register = async () => {
    throw new SessionValidationError("Faltan datos obligatorios");
  };
  context.after(() => {
    sessionsService.register = original;
  });
  const { response, result } = createResponse();

  await register({ body: {} }, response, assert.fail);

  assert.deepEqual(result, {
    statusCode: 400,
    body: { status: "error", message: "Faltan datos obligatorios" },
  });
});

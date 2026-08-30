import assert from "node:assert/strict";
import test from "node:test";

import passport from "../src/config/passport.js";
import {
  UserEmailConflictError,
  UserValidationError,
} from "../src/errors/users.errors.js";
import { registerWithPassport } from "../src/middlewares/register.middleware.js";

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
        return this;
      },
    },
  };
};

const stubAuthenticate = (context, result) => {
  const original = passport.authenticate;
  passport.authenticate = (_strategy, _options, callback) =>
    (_req, _res, _next) => callback(
      result.error,
      result.user,
      result.info,
      result.status,
    );
  context.after(() => {
    passport.authenticate = original;
  });
};

test("register middleware exposes the created user", (context) => {
  const user = { _id: "user-id", email: "tom@example.com" };
  stubAuthenticate(context, { user });
  const request = {};
  const { response } = createResponse();
  let nextCalled = false;

  registerWithPassport(request, response, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(request.user, user);
});

test("register middleware maps validation errors", (context) => {
  const error = new UserValidationError("Datos inválidos");
  stubAuthenticate(context, { error });
  const { response, result } = createResponse();

  registerWithPassport({}, response, assert.fail);

  assert.deepEqual(result, {
    statusCode: 400,
    body: { status: "error", message: "Datos inválidos" },
  });
});

test("register middleware maps duplicate emails", (context) => {
  const error = new UserEmailConflictError();
  stubAuthenticate(context, { error });
  const { response, result } = createResponse();

  registerWithPassport({}, response, assert.fail);

  assert.equal(result.statusCode, 409);
  assert.equal(result.body.status, "error");
});

test("register middleware forwards unexpected errors", (context) => {
  const expectedError = new Error("database unavailable");
  stubAuthenticate(context, { error: expectedError });
  const { response } = createResponse();
  let forwardedError;

  registerWithPassport({}, response, (error) => {
    forwardedError = error;
  });

  assert.equal(forwardedError, expectedError);
});

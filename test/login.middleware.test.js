import assert from "node:assert/strict";
import test from "node:test";

import passport from "../src/config/passport.js";
import { loginWithPassport } from "../src/middlewares/login.middleware.js";

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
    (req, res, next) => callback(result.error, result.user, result.info, result.status);
  context.after(() => {
    passport.authenticate = original;
  });
};

test("login middleware returns JSON for invalid credentials", (context) => {
  stubAuthenticate(context, { user: false });
  const { response, result } = createResponse();

  loginWithPassport({}, response, assert.fail);

  assert.deepEqual(result, {
    statusCode: 401,
    body: { status: "error", message: "Credenciales inválidas" },
  });
});

test("login middleware exposes a safe user payload", (context) => {
  stubAuthenticate(context, {
    user: {
      _id: { toString: () => "user-id" },
      email: "tom@example.com",
      password: "password-hash",
      role: "user",
    },
  });
  const request = {};
  const { response } = createResponse();
  let nextCalled = false;

  loginWithPassport(request, response, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.deepEqual(request.user, {
    id: "user-id",
    email: "tom@example.com",
    role: "user",
  });
});

test("login middleware forwards unexpected authentication errors", (context) => {
  const expectedError = new Error("database unavailable");
  stubAuthenticate(context, { error: expectedError });
  const { response } = createResponse();
  let forwardedError;

  loginWithPassport({}, response, (error) => {
    forwardedError = error;
  });

  assert.equal(forwardedError, expectedError);
});

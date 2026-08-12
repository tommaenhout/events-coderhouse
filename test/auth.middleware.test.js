import assert from "node:assert/strict";
import test from "node:test";

import { authMiddleware } from "../src/middlewares/auth.middleware.js";
import { generateJWT } from "../src/utils/jwt.js";

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

test("authentication middleware requires the access-token cookie", () => {
  const { response, result } = createResponse();
  let nextCalled = false;

  authMiddleware({ cookies: {} }, response, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.deepEqual(result, {
    statusCode: 401,
    body: { status: "error", message: "No autenticado" },
  });
});

test("authentication middleware exposes a verified user to the next handler", () => {
  const { response, result } = createResponse();
  const req = {
    cookies: {
      currentUser: generateJWT({
        id: "user-id",
        email: "tom@example.com",
        role: "user",
      }),
    },
  };
  let nextCalled = false;

  authMiddleware(req, response, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(req.user.id, "user-id");
  assert.equal(req.user.email, "tom@example.com");
  assert.deepEqual(result, {});
});

test("authentication middleware rejects an invalid access token", () => {
  const { response, result } = createResponse();
  let nextCalled = false;

  authMiddleware(
    { cookies: { currentUser: "invalid-token" } },
    response,
    () => {
      nextCalled = true;
    },
  );

  assert.equal(nextCalled, false);
  assert.deepEqual(result, {
    statusCode: 401,
    body: { status: "error", message: "Token inválido o expirado" },
  });
});

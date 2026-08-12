import assert from "node:assert/strict";
import test from "node:test";

import {
  getCurrentUser,
  login,
  logout,
  refresh,
  register,
} from "../src/controllers/sessions.controller.js";
import {
  InvalidCredentialsError,
  SessionValidationError,
} from "../src/errors/sessions.errors.js";
import { UserEmailConflictError } from "../src/errors/users.errors.js";
import sessionsService from "../src/services/sessions.service.js";
import {
  generateRefreshToken,
  verifyJWT,
} from "../src/utils/jwt.js";

const createResponse = () => {
  const result = { cookies: [], clearedCookies: [] };
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
      cookie(name, value, options) {
        result.cookies.push({ name, value, options });
        return this;
      },
      clearCookie(name) {
        result.clearedCookies.push(name);
        return this;
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
    cookies: [],
    clearedCookies: [],
  });
});

test("login controller sets distinct access and refresh cookies", async (context) => {
  const original = sessionsService.login;
  sessionsService.login = async () => ({
    id: "user-id",
    email: "tom@example.com",
    role: "user",
  });
  context.after(() => {
    sessionsService.login = original;
  });
  const { response, result } = createResponse();

  await login({ body: { email: "tom@example.com", password: "password123" } }, response);

  assert.equal(result.statusCode, 200);
  assert.deepEqual(result.body, {
    status: "success",
    message: "Login correcto",
  });
  assert.deepEqual(
    result.cookies.map(({ name }) => name),
    ["currentUser", "refreshToken"],
  );
  assert.notEqual(result.cookies[0].value, result.cookies[1].value);
  assert.deepEqual(result.cookies[0].options, {
    httpOnly: true,
    maxAge: 1000 * 60 * 60,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  assert.deepEqual(result.cookies[1].options, {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
});

test("login controller maps invalid credentials to 401", async (context) => {
  const original = sessionsService.login;
  sessionsService.login = async () => {
    throw new InvalidCredentialsError();
  };
  context.after(() => {
    sessionsService.login = original;
  });
  const { response, result } = createResponse();

  await login({ body: {} }, response);

  assert.equal(result.statusCode, 401);
  assert.deepEqual(result.body, {
    status: "error",
    message: "Credenciales inválidas",
  });
  assert.equal(result.cookies.length, 0);
});

test("login controller forwards unexpected errors", async (context) => {
  const expectedError = new Error("database unavailable");
  const original = sessionsService.login;
  sessionsService.login = async () => {
    throw expectedError;
  };
  context.after(() => {
    sessionsService.login = original;
  });
  const { response, result } = createResponse();
  let forwardedError;

  await login({ body: {} }, response, (error) => {
    forwardedError = error;
  });

  assert.equal(forwardedError, expectedError);
  assert.equal(result.statusCode, undefined);
  assert.equal(result.cookies.length, 0);
});

test("logout controller clears both authentication cookies", async () => {
  const { response, result } = createResponse();

  await logout({}, response);

  assert.deepEqual(result.clearedCookies, ["currentUser", "refreshToken"]);
  assert.equal(result.statusCode, 200);
  assert.deepEqual(result.body, {
    status: "success",
    message: "logout correcto",
  });
});

test("current-user controller returns the authenticated user", async () => {
  const { response, result } = createResponse();
  const user = { id: "user-id", email: "tom@example.com", role: "user" };

  await getCurrentUser({ user }, response);

  assert.equal(result.statusCode, 200);
  assert.deepEqual(result.body, { status: "success", payload: user });
});

test("refresh controller requires a refresh-token cookie", async () => {
  const { response, result } = createResponse();

  await refresh({ cookies: {} }, response);

  assert.equal(result.statusCode, 401);
  assert.deepEqual(result.body, {
    status: "error",
    message: "refresh token no encontrado",
  });
  assert.equal(result.cookies.length, 0);
});

test("refresh controller replaces the access-token cookie", async () => {
  const { response, result } = createResponse();
  const refreshToken = generateRefreshToken({ id: "user-id" });

  await refresh({ cookies: { refreshToken } }, response);

  assert.equal(result.statusCode, 200);
  assert.deepEqual(result.body, {
    status: "success",
    message: "token renovado",
  });
  assert.equal(result.cookies.length, 1);
  assert.equal(result.cookies[0].name, "currentUser");
  assert.equal(verifyJWT(result.cookies[0].value).id, "user-id");
});

test("refresh controller rejects an invalid refresh token", async () => {
  const { response, result } = createResponse();

  await refresh({ cookies: { refreshToken: "invalid-token" } }, response);

  assert.equal(result.statusCode, 500);
  assert.equal(result.body.status, "error");
  assert.equal(typeof result.body.message, "string");
  assert.equal(result.cookies.length, 0);
});

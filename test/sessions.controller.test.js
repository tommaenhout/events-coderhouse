import assert from "node:assert/strict";
import test from "node:test";

import { env } from "../src/config/env.js";
import {
  current,
  login,
  logout,
  register,
} from "../src/controllers/sessions.controller.js";
import { verifyJWT } from "../src/utils/jwt.js";

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
        return this;
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

test("register controller confirms that Passport created the user", async () => {
  const { response, result } = createResponse();

  await register({ user: { id: "user-id" } }, response);

  assert.deepEqual(result, {
    statusCode: 201,
    body: { message: "Usuario registrado exitosamente" },
    cookies: [],
    clearedCookies: [],
  });
});

test("login controller creates one access-token cookie", async () => {
  const { response, result } = createResponse();
  const user = {
    id: "user-id",
    email: "tom@example.com",
    role: "user",
  };

  await login({ user }, response);

  assert.equal(result.statusCode, 200);
  assert.deepEqual(result.body, {
    status: "success",
    message: "Login exitoso",
  });
  assert.equal(result.cookies.length, 1);
  assert.equal(result.cookies[0].name, "currentUser");
  assert.deepEqual(result.cookies[0].options, {
    httpOnly: true,
    maxAge: env.jwtCookieExpiresIn,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  const payload = verifyJWT(result.cookies[0].value);
  assert.equal(payload.id, "user-id");
  assert.equal(payload.email, "tom@example.com");
  assert.equal(payload.role, "user");
});

test("login controller returns 500 when token creation fails", async () => {
  const { response, result } = createResponse();
  const cyclicUser = { id: "user-id" };
  cyclicUser.self = cyclicUser;

  await login({ user: cyclicUser }, response);

  assert.equal(result.statusCode, 500);
  assert.deepEqual(result.body, {
    status: "error",
    message: "Error en el servidor al intentar iniciar sesión",
  });
  assert.equal(result.cookies.length, 0);
});

test("current controller returns a public user DTO", async () => {
  const { response, result } = createResponse();

  await current(
    {
      user: {
        _id: "user-id",
        email: "tom@example.com",
        password: "password-hash",
        role: "user",
      },
    },
    response,
  );

  assert.equal(result.statusCode, 200);
  assert.equal(result.body.status, "success");
  assert.deepEqual({ ...result.body.payload }, {
    id: "user-id",
    email: "tom@example.com",
    role: "user",
  });
  assert.deepEqual(result.cookies, []);
  assert.deepEqual(result.clearedCookies, []);
});

test("logout controller clears the access-token cookie", async () => {
  const { response, result } = createResponse();

  await logout({}, response);

  assert.deepEqual(result, {
    statusCode: 200,
    body: { status: "success", message: "Logout correcto" },
    cookies: [],
    clearedCookies: ["currentUser"],
  });
});

import assert from "node:assert/strict";
import test from "node:test";

import passport from "../src/config/passport.js";
import usersRepository from "../src/repositories/users.repository.js";
import usersService from "../src/services/users.service.js";
import { createHash } from "../src/utils/hash.js";

const stubMethod = (context, target, method, implementation) => {
  const original = target[method];
  target[method] = implementation;
  context.after(() => {
    target[method] = original;
  });
};

const verifyStrategy = (strategy, ...args) =>
  new Promise((resolve) => {
    strategy._verify(...args, (error, user, info) => {
      resolve({ error, user, info });
    });
  });

test("register strategy delegates user creation to UsersService", async (context) => {
  let receivedData;
  const createdUser = { _id: "new-user", email: "tom@example.com" };
  stubMethod(context, usersService, "registerUser", async (data) => {
    receivedData = data;
    return createdUser;
  });

  const result = await verifyStrategy(
    passport._strategy("register"),
    { body: { first_name: "Tom", last_name: "Tester" } },
    "tom@example.com",
    "password123",
  );

  assert.deepEqual(receivedData, {
    first_name: "Tom",
    last_name: "Tester",
    email: "tom@example.com",
    password: "password123",
  });
  assert.equal(result.error, null);
  assert.equal(result.user, createdUser);
});

test("login strategy normalizes email and verifies the password", async (context) => {
  const password = await createHash("password123");
  let receivedEmail;
  const storedUser = {
    _id: "user-id",
    email: "tom@example.com",
    password,
    role: "user",
  };
  stubMethod(context, usersRepository, "findByEmail", async (email) => {
    receivedEmail = email;
    return storedUser;
  });

  const result = await verifyStrategy(
    passport._strategy("login"),
    " TOM@example.com ",
    "password123",
  );

  assert.equal(receivedEmail, "tom@example.com");
  assert.equal(result.error, null);
  assert.equal(result.user, storedUser);
});

test("login strategy rejects unknown users and wrong passwords", async (context) => {
  const password = await createHash("password123");
  let storedUser = null;
  stubMethod(
    context,
    usersRepository,
    "findByEmail",
    async () => storedUser,
  );

  const unknown = await verifyStrategy(
    passport._strategy("login"),
    "missing@example.com",
    "password123",
  );
  assert.equal(unknown.user, false);
  assert.equal(unknown.info.message, "credenciales inválidas");

  storedUser = {
    _id: "user-id",
    email: "tom@example.com",
    password,
    role: "user",
  };
  const invalidPassword = await verifyStrategy(
    passport._strategy("login"),
    "tom@example.com",
    "incorrect-password",
  );
  assert.equal(invalidPassword.user, false);
  assert.equal(invalidPassword.info.message, "credenciales inválidas");
});

test("current strategy reloads the user represented by the JWT", async (context) => {
  let receivedId;
  const storedUser = {
    _id: "user-id",
    email: "tom@example.com",
    role: "user",
  };
  stubMethod(context, usersRepository, "findById", async (id) => {
    receivedId = id;
    return storedUser;
  });

  const result = await verifyStrategy(
    passport._strategy("current"),
    { id: "user-id" },
  );

  assert.equal(receivedId, "user-id");
  assert.equal(result.error, null);
  assert.equal(result.user, storedUser);
});

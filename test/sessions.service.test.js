import assert from "node:assert/strict";
import test from "node:test";

import {
  InvalidCredentialsError,
  SessionValidationError,
} from "../src/errors/sessions.errors.js";
import { UserEmailConflictError } from "../src/errors/users.errors.js";
import usersRepository from "../src/repositories/users.repository.js";
import sessionsService from "../src/services/sessions.service.js";
import { createHash } from "../src/utils/hash.js";

const stubRepository = (context, stubs) => {
  const originals = {};
  for (const [method, implementation] of Object.entries(stubs)) {
    originals[method] = usersRepository[method];
    usersRepository[method] = implementation;
  }
  context.after(() => Object.assign(usersRepository, originals));
};

test("sessions service registers a user without returning password", async (context) => {
  let persistedUser;
  stubRepository(context, {
    findByEmail: async () => null,
    create: async (data) => {
      persistedUser = data;
      return { _id: "new", ...data };
    },
  });

  const user = await sessionsService.register({
    first_name: "Tom",
    last_name: "Tester",
    email: "TOM@example.com",
    password: "password123",
  });

  assert.equal(user.password, undefined);
  assert.equal(user.email, "tom@example.com");
  assert.notEqual(persistedUser.password, "password123");
});

test("sessions service uses a typed duplicate-email error", async (context) => {
  stubRepository(context, { findByEmail: async () => ({ _id: "existing" }) });

  await assert.rejects(
    sessionsService.register({
      first_name: "Tom",
      last_name: "Tester",
      email: "tom@example.com",
      password: "password123",
    }),
    UserEmailConflictError,
  );
});

test("sessions service validation messages are in Spanish", async () => {
  await assert.rejects(
    sessionsService.register({}),
    (error) =>
      error instanceof SessionValidationError &&
      error.message ===
        "Los campos first_name, last_name, email y password son obligatorios",
  );

  await assert.rejects(
    sessionsService.register({
      first_name: "Tom",
      last_name: "Tester",
      email: "email-invalido",
      password: "password123",
    }),
    (error) =>
      error instanceof SessionValidationError &&
      error.message === "El formato del email no es válido",
  );
});

test("sessions service validates the password before logging in", async (context) => {
  const password = await createHash("password123");
  stubRepository(context, {
    findByEmail: async () => ({
      _id: { toString: () => "user-id" },
      email: "tom@example.com",
      password,
      role: "user",
    }),
  });

  await assert.rejects(
    sessionsService.login({
      email: "tom@example.com",
      password: "incorrect-password",
    }),
    InvalidCredentialsError,
  );

  const user = await sessionsService.login({
    email: "TOM@example.com",
    password: "password123",
  });

  assert.deepEqual(user, {
    id: "user-id",
    email: "tom@example.com",
    role: "user",
  });
});

test("sessions service rejects missing login credentials generically", async () => {
  await assert.rejects(
    sessionsService.login({ email: "tom@example.com" }),
    InvalidCredentialsError,
  );
  await assert.rejects(
    sessionsService.login({ password: "password123" }),
    InvalidCredentialsError,
  );
});

test("sessions service rejects an unknown login email", async (context) => {
  stubRepository(context, { findByEmail: async () => null });

  await assert.rejects(
    sessionsService.login({
      email: "missing@example.com",
      password: "password123",
    }),
    InvalidCredentialsError,
  );
});

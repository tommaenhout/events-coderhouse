import assert from "node:assert/strict";
import test from "node:test";

import { UserEmailConflictError } from "../src/errors/users.errors.js";
import usersRepository from "../src/repositories/users.repository.js";
import sessionsService from "../src/services/sessions.service.js";

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

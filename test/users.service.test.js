import assert from "node:assert/strict";
import test from "node:test";

import {
  UserEmailConflictError,
  UserNotFoundError,
  UserValidationError,
} from "../src/errors/users.errors.js";
import usersRepository from "../src/repositories/users.repository.js";
import usersService from "../src/services/users.service.js";

const stubRepository = (context, stubs) => {
  const originals = {};
  for (const [method, implementation] of Object.entries(stubs)) {
    originals[method] = usersRepository[method];
    usersRepository[method] = implementation;
  }
  context.after(() => Object.assign(usersRepository, originals));
};

test("users service hashes passwords and returns a public user", async (context) => {
  let persistedUser;
  stubRepository(context, {
    findByEmail: async () => null,
    create: async (data) => {
      persistedUser = data;
      return { _id: "new", ...data };
    },
  });

  const user = await usersService.createUser({
    first_name: " Tom ",
    last_name: " Tester ",
    email: " TOM@example.com ",
    password: "password123",
  });

  assert.equal(user.password, undefined);
  assert.equal(user.email, "tom@example.com");
  assert.notEqual(persistedUser.password, "password123");
  assert.equal(persistedUser.first_name, "Tom");
});

test("users service validates duplicates and missing users", async (context) => {
  assert.rejects(
    usersService.createUser({ first_name: "Tom" }),
    UserValidationError,
  );

  stubRepository(context, {
    findByEmail: async () => ({ _id: "existing" }),
    findById: async () => null,
  });

  await assert.rejects(
    usersService.createUser({
      first_name: "Tom",
      last_name: "Tester",
      email: "tom@example.com",
      password: "password123",
    }),
    UserEmailConflictError,
  );
  await assert.rejects(usersService.getUserById("missing"), UserNotFoundError);
});

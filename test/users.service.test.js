import assert from "node:assert/strict";
import test from "node:test";

import {
  UserEmailConflictError,
  UserNotFoundError,
  UserValidationError,
} from "../src/errors/users.errors.js";
import { createUsersService } from "../src/services/users.service.js";

test("users service normalizes and creates users", async () => {
  const calls = [];
  const userRepository = {
    async findByEmail(email) {
      calls.push(["findByEmail", email]);
      return null;
    },
    async create(data) {
      calls.push(["create", data]);
      return { _id: "user-id", ...data };
    },
  };
  const service = createUsersService({ userRepository });

  const user = await service.createUser({
    name: "  Tom  ",
    email: "  TOM@Example.com ",
    role: "user",
    password: "ignored",
  });

  assert.deepEqual(user, {
    _id: "user-id",
    name: "Tom",
    email: "tom@example.com",
    role: "user",
  });
  assert.deepEqual(calls, [
    ["findByEmail", "tom@example.com"],
    [
      "create",
      { name: "Tom", email: "tom@example.com", role: "user" },
    ],
  ]);
});

test("users service rejects invalid and duplicate users", async () => {
  const invalidService = createUsersService({ userRepository: {} });

  await assert.rejects(
    invalidService.createUser({ name: "Tom", email: "invalid" }),
    UserValidationError,
  );

  const duplicateService = createUsersService({
    userRepository: { findByEmail: async () => ({ _id: "existing" }) },
  });

  await assert.rejects(
    duplicateService.createUser({ name: "Tom", email: "tom@example.com" }),
    UserEmailConflictError,
  );
});

test("users service handles listing, updates, deletion and missing users", async () => {
  const calls = [];
  const userRepository = {
    findAll: async () => ["all"],
    findById: async (id) => (id === "missing" ? null : { _id: id }),
    findByEmail: async () => null,
    updateById: async (id, data) => {
      calls.push(["updateById", id, data]);
      return { _id: id, ...data };
    },
    deleteById: async (id) => (id === "missing" ? null : { _id: id }),
  };
  const service = createUsersService({ userRepository });

  assert.deepEqual(await service.getUsers(), ["all"]);
  assert.deepEqual(await service.getUserById("one"), { _id: "one" });
  assert.deepEqual(await service.updateUser("one", { name: "Daniel" }), {
    _id: "one",
    name: "Daniel",
  });
  assert.deepEqual(await service.deleteUser("one"), { _id: "one" });
  assert.deepEqual(calls, [["updateById", "one", { name: "Daniel" }]]);

  await assert.rejects(service.getUserById("missing"), UserNotFoundError);
  await assert.rejects(service.deleteUser("missing"), UserNotFoundError);
});

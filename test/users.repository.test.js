import assert from "node:assert/strict";
import test from "node:test";

import { createUserRepository } from "../src/repositories/users.repository.js";

test("user repository delegates CRUD operations to the injected DAO", async () => {
  const calls = [];
  const userDao = Object.fromEntries(
    ["findAll", "findById", "findByEmail", "create", "updateById", "deleteById"].map(
      (method) => [
        method,
        async (...args) => {
          calls.push([method, ...args]);
          return method;
        },
      ],
    ),
  );
  const repository = createUserRepository({ userDao });

  assert.equal(await repository.findAll(), "findAll");
  assert.equal(await repository.findById("one"), "findById");
  assert.equal(await repository.findByEmail("tom@example.com"), "findByEmail");
  assert.equal(await repository.create({ name: "Tom" }), "create");
  assert.equal(await repository.updateById("one", { name: "Daniel" }), "updateById");
  assert.equal(await repository.deleteById("one"), "deleteById");

  assert.deepEqual(calls, [
    ["findAll"],
    ["findById", "one"],
    ["findByEmail", "tom@example.com"],
    ["create", { name: "Tom" }],
    ["updateById", "one", { name: "Daniel" }],
    ["deleteById", "one"],
  ]);
});

import assert from "node:assert/strict";
import test from "node:test";

import usersDao from "../src/dao/users.dao.js";
import usersRepository from "../src/repositories/users.repository.js";

test("users repository delegates authentication operations to the DAO", async (context) => {
  const calls = [];
  const originals = {};
  for (const method of [
    "findById",
    "findByEmail",
    "create",
  ]) {
    originals[method] = usersDao[method];
    usersDao[method] = async (...args) => {
      calls.push([method, ...args]);
      return method;
    };
  }
  context.after(() => Object.assign(usersDao, originals));

  assert.equal(await usersRepository.findById("one"), "findById");
  assert.equal(await usersRepository.findByEmail("tom@example.com"), "findByEmail");
  assert.equal(await usersRepository.create({ email: "tom@example.com" }), "create");
  assert.equal(calls.length, 3);
});

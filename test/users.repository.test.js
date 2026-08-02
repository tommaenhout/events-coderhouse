import assert from "node:assert/strict";
import test from "node:test";

import usersDao from "../src/dao/users.dao.js";
import usersRepository from "../src/repositories/users.repository.js";

test("users repository delegates CRUD operations to the DAO", async (context) => {
  const calls = [];
  const originals = {};
  for (const method of [
    "findAll",
    "findById",
    "findByEmail",
    "create",
    "updateById",
    "deleteById",
  ]) {
    originals[method] = usersDao[method];
    usersDao[method] = async (...args) => {
      calls.push([method, ...args]);
      return method;
    };
  }
  context.after(() => Object.assign(usersDao, originals));

  assert.equal(await usersRepository.findAll(), "findAll");
  assert.equal(await usersRepository.findById("one"), "findById");
  assert.equal(await usersRepository.findByEmail("tom@example.com"), "findByEmail");
  assert.equal(await usersRepository.create({ email: "tom@example.com" }), "create");
  assert.equal(await usersRepository.updateById("one", { role: "admin" }), "updateById");
  assert.equal(await usersRepository.deleteById("one"), "deleteById");
  assert.equal(calls.length, 6);
});

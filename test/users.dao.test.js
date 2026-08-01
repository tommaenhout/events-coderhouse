import assert from "node:assert/strict";
import test from "node:test";

import { createUserDao } from "../src/dao/users.dao.js";
import { UserEmailConflictError } from "../src/errors/users.errors.js";

const leanResult = (value) => ({ lean: () => value });

test("user DAO delegates CRUD operations to the injected Mongoose model", async () => {
  const calls = [];
  const UserModel = {
    find() {
      calls.push(["find"]);
      return leanResult(["all"]);
    },
    findById(id) {
      calls.push(["findById", id]);
      return leanResult({ id });
    },
    findOne(filter) {
      calls.push(["findOne", filter]);
      return leanResult({ email: filter.email });
    },
    async create(data) {
      calls.push(["create", data]);
      return { toObject: () => ({ id: "created", ...data }) };
    },
    findByIdAndUpdate(id, data, options) {
      calls.push(["findByIdAndUpdate", id, data, options]);
      return leanResult({ id, ...data });
    },
    findByIdAndDelete(id) {
      calls.push(["findByIdAndDelete", id]);
      return leanResult({ id });
    },
  };
  const userDao = createUserDao({ UserModel });

  assert.deepEqual(await userDao.findAll(), ["all"]);
  assert.deepEqual(await userDao.findById("one"), { id: "one" });
  assert.deepEqual(await userDao.findByEmail("tom@example.com"), {
    email: "tom@example.com",
  });
  assert.deepEqual(await userDao.create({ name: "Tom" }), {
    id: "created",
    name: "Tom",
  });
  assert.deepEqual(await userDao.updateById("one", { name: "Daniel" }), {
    id: "one",
    name: "Daniel",
  });
  assert.deepEqual(await userDao.deleteById("one"), { id: "one" });

  assert.deepEqual(calls, [
    ["find"],
    ["findById", "one"],
    ["findOne", { email: "tom@example.com" }],
    ["create", { name: "Tom" }],
    [
      "findByIdAndUpdate",
      "one",
      { name: "Daniel" },
      { new: true, runValidators: true },
    ],
    ["findByIdAndDelete", "one"],
  ]);
});

test("user DAO translates duplicate key errors", async () => {
  const UserModel = {
    async create() {
      throw Object.assign(new Error("duplicate"), { code: 11_000 });
    },
  };
  const userDao = createUserDao({ UserModel });

  await assert.rejects(userDao.create({}), UserEmailConflictError);
});

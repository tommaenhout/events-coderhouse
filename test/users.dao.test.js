import assert from "node:assert/strict";
import test from "node:test";

import usersDao from "../src/dao/users.dao.js";
import { UserEmailConflictError } from "../src/errors/users.errors.js";
import { User } from "../src/models/user.model.js";

const stubModel = (context, stubs) => {
  const originals = {};
  for (const [method, implementation] of Object.entries(stubs)) {
    originals[method] = User[method];
    User[method] = implementation;
  }
  context.after(() => Object.assign(User, originals));
};

const selectableQuery = (value, selectedFields) => ({
  select(fields) {
    selectedFields.push(fields);
    return this;
  },
  lean() {
    return value;
  },
});

test("users DAO returns plain users without exposing passwords", async (context) => {
  const selections = [];
  const createdDocument = {
    toObject: () => ({
      _id: "new",
      email: "tom@example.com",
      password: "hashed-password",
    }),
  };
  stubModel(context, {
    find: () => selectableQuery(["all"], selections),
    findById: (id) => selectableQuery({ _id: id }, selections),
    findOne: ({ email }) => ({ lean: () => ({ email, password: "hash" }) }),
    create: async () => createdDocument,
    findByIdAndUpdate: (id) => selectableQuery({ _id: id }, selections),
    findByIdAndDelete: (id) => selectableQuery({ _id: id }, selections),
  });

  assert.deepEqual(await usersDao.findAll(), ["all"]);
  assert.deepEqual(await usersDao.findById("one"), { _id: "one" });
  assert.deepEqual(await usersDao.findByEmail("tom@example.com"), {
    email: "tom@example.com",
    password: "hash",
  });
  assert.deepEqual(await usersDao.create({}), createdDocument.toObject());
  assert.deepEqual(await usersDao.updateById("one", {}), { _id: "one" });
  assert.deepEqual(await usersDao.deleteById("one"), { _id: "one" });
  assert.deepEqual(selections, ["-password", "-password", "-password", "-password"]);
});

test("users DAO translates duplicate email errors", async (context) => {
  stubModel(context, {
    create: async () => {
      throw Object.assign(new Error("duplicate"), { code: 11_000 });
    },
  });

  await assert.rejects(usersDao.create({}), UserEmailConflictError);
});

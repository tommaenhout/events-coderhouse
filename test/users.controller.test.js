import assert from "node:assert/strict";
import test from "node:test";

import { createUsersController } from "../src/controllers/users.controller.js";
import {
  UserEmailConflictError,
  UserNotFoundError,
  UserValidationError,
} from "../src/errors/users.errors.js";

const createResponse = () => {
  const result = {};
  return {
    result,
    response: {
      status(statusCode) {
        result.statusCode = statusCode;
        return this;
      },
      json(body) {
        result.body = body;
      },
    },
  };
};

test("users controller maps CRUD operations to HTTP responses", async () => {
  const calls = [];
  const usersService = {
    getUsers: async () => ["all"],
    getUserById: async (id) => ({ _id: id }),
    createUser: async (data) => ({ _id: "created", ...data }),
    updateUser: async (id, data) => ({ _id: id, ...data }),
    deleteUser: async (id) => {
      calls.push(["deleteUser", id]);
      return { _id: id };
    },
  };
  const controller = createUsersController({ usersService });
  const listResult = createResponse();
  const getResult = createResponse();
  const createResult = createResponse();
  const updateResult = createResponse();
  const deleteResult = createResponse();

  await controller.getUsers({}, listResult.response, assert.fail);
  await controller.getUserById(
    { params: { id: "one" } },
    getResult.response,
    assert.fail,
  );
  await controller.createUser(
    { body: { name: "Tom" } },
    createResult.response,
    assert.fail,
  );
  await controller.updateUser(
    { params: { id: "one" }, body: { name: "Daniel" } },
    updateResult.response,
    assert.fail,
  );
  await controller.deleteUser(
    { params: { id: "one" } },
    deleteResult.response,
    assert.fail,
  );

  assert.equal(listResult.result.statusCode, 200);
  assert.equal(getResult.result.statusCode, 200);
  assert.equal(createResult.result.statusCode, 201);
  assert.equal(updateResult.result.statusCode, 200);
  assert.equal(deleteResult.result.statusCode, 200);
  assert.deepEqual(calls, [["deleteUser", "one"]]);
});

test("users controller maps domain errors to HTTP status codes", async () => {
  const cases = [
    [new UserValidationError("invalid"), 400],
    [new UserNotFoundError(), 404],
    [new UserEmailConflictError(), 409],
  ];

  for (const [error, expectedStatus] of cases) {
    const usersService = {
      async getUsers() {
        throw error;
      },
    };
    const controller = createUsersController({ usersService });
    const { response, result } = createResponse();

    await controller.getUsers({}, response, assert.fail);
    assert.equal(result.statusCode, expectedStatus);
  }
});

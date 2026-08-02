import assert from "node:assert/strict";
import test from "node:test";

import {
  createUser,
  deleteUser,
  getUserById,
  getUsers,
  updateUser,
} from "../src/controllers/users.controller.js";
import {
  UserEmailConflictError,
  UserNotFoundError,
  UserValidationError,
} from "../src/errors/users.errors.js";
import usersService from "../src/services/users.service.js";

const createResponse = () => {
  const result = {};
  return {
    result,
    response: {
      status(code) {
        result.statusCode = code;
        return this;
      },
      json(body) {
        result.body = body;
      },
    },
  };
};

const stubService = (context, method, implementation) => {
  const original = usersService[method];
  usersService[method] = implementation;
  context.after(() => {
    usersService[method] = original;
  });
};

test("users controllers map CRUD results to HTTP", async (context) => {
  const methods = {
    getUsers: async () => ["all"],
    getUserById: async (id) => ({ id }),
    createUser: async (data) => ({ id: "new", ...data }),
    updateUser: async (id, data) => ({ id, ...data }),
    deleteUser: async (id) => ({ id }),
  };
  for (const [method, implementation] of Object.entries(methods)) {
    stubService(context, method, implementation);
  }

  const responses = Array.from({ length: 5 }, createResponse);
  await getUsers({}, responses[0].response, assert.fail);
  await getUserById({ params: { id: "one" } }, responses[1].response, assert.fail);
  await createUser({ body: {} }, responses[2].response, assert.fail);
  await updateUser({ params: { id: "one" }, body: {} }, responses[3].response, assert.fail);
  await deleteUser({ params: { id: "one" } }, responses[4].response, assert.fail);

  assert.deepEqual(responses.map(({ result }) => result.statusCode), [200, 200, 201, 200, 200]);
});

test("users controller maps domain errors", async (context) => {
  const cases = [
    [new UserValidationError("invalid"), 400],
    [new UserNotFoundError(), 404],
    [new UserEmailConflictError(), 409],
  ];
  for (const [error, expectedStatus] of cases) {
    stubService(context, "getUsers", async () => {
      throw error;
    });
    const { response, result } = createResponse();
    await getUsers({}, response, assert.fail);
    assert.equal(result.statusCode, expectedStatus);
  }
});

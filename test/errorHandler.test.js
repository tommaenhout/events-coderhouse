import assert from "node:assert/strict";
import test from "node:test";

import { createErrorHandler } from "../src/middlewares/errorHandler.js";

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

test("error handler maps database validation errors to 400", () => {
  const logger = { error: assert.fail };
  const handler = createErrorHandler({ logger });
  const { response, result } = createResponse();
  const error = Object.assign(new Error("invalid id"), { name: "CastError" });

  handler(error, {}, response, () => {});

  assert.deepEqual(result, {
    statusCode: 400,
    body: { status: "error", message: "Solicitud inválida" },
  });
});

test("error handler logs unexpected errors and maps them to 500", () => {
  const expectedError = new Error("unexpected");
  let loggedError;
  const logger = {
    error(error) {
      loggedError = error;
    },
  };
  const handler = createErrorHandler({ logger });
  const { response, result } = createResponse();

  handler(expectedError, {}, response, () => {});

  assert.equal(loggedError, expectedError);
  assert.deepEqual(result, {
    statusCode: 500,
    body: { status: "error", message: "Error interno del servidor" },
  });
});

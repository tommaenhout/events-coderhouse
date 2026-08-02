import assert from "node:assert/strict";
import test from "node:test";

import { notFoundHandler } from "../src/middlewares/notFoundHandler.js";

test("not-found handler returns Spanish JSON feedback", () => {
  const result = {};
  const response = {
    status(code) {
      result.statusCode = code;
      return this;
    },
    json(body) {
      result.body = body;
    },
  };

  notFoundHandler({}, response);

  assert.deepEqual(result, {
    statusCode: 404,
    body: { status: "error", message: "Ruta no encontrada" },
  });
});

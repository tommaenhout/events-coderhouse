import assert from "node:assert/strict";
import test from "node:test";

import {
  createEvent,
  deleteEvent,
  getEventById,
  getEvents,
  updateEvent,
} from "../src/controllers/events.controller.js";
import eventsService, {
  EventNotFoundError,
  EventValidationError,
} from "../src/services/events.service.js";

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
  const original = eventsService[method];
  eventsService[method] = implementation;
  context.after(() => {
    eventsService[method] = original;
  });
};

test("events controllers map CRUD results to HTTP", async (context) => {
  const methods = {
    getEvents: async () => ["all"],
    getEventById: async (id) => ({ id }),
    createEvent: async (data) => ({ id: "new", ...data }),
    updateEvent: async (id, data) => ({ id, ...data }),
    deleteEvent: async (id) => ({ id }),
  };
  for (const [method, implementation] of Object.entries(methods)) {
    stubService(context, method, implementation);
  }

  const responses = Array.from({ length: 5 }, createResponse);
  await getEvents({}, responses[0].response, assert.fail);
  await getEventById({ params: { id: "one" } }, responses[1].response, assert.fail);
  await createEvent({ body: { title: "New" } }, responses[2].response, assert.fail);
  await updateEvent(
    { params: { id: "one" }, body: { title: "Updated" } },
    responses[3].response,
    assert.fail,
  );
  await deleteEvent({ params: { id: "one" } }, responses[4].response, assert.fail);

  assert.deepEqual(responses.map(({ result }) => result.statusCode), [200, 200, 201, 200, 200]);
});

test("events controller maps domain errors", async (context) => {
  const cases = [
    [new EventValidationError("invalid"), 400],
    [new EventNotFoundError(), 404],
  ];

  for (const [error, expectedStatus] of cases) {
    stubService(context, "getEvents", async () => {
      throw error;
    });
    const { response, result } = createResponse();
    await getEvents({}, response, assert.fail);
    assert.equal(result.statusCode, expectedStatus);
  }
});

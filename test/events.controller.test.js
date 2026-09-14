import assert from "node:assert/strict";
import test from "node:test";

import {
  changeEventStatus,
  createEvent,
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

test("events controllers map results to HTTP", async (context) => {
  const methods = {
    getEvents: async () => ["all"],
    getEventById: async (id) => ({ id }),
    createEvent: async (data, userId) => {
      assert.equal(userId, "owner");
      return { id: "new", ...data };
    },
    updateEvent: async (id, data) => ({ id, ...data }),
    changeStatus: async (id, status) => ({ id, status }),
  };
  for (const [method, implementation] of Object.entries(methods)) {
    stubService(context, method, implementation);
  }

  const responses = Array.from({ length: 5 }, createResponse);
  await getEvents({}, responses[0].response, assert.fail);
  await getEventById({ params: { id: "one" } }, responses[1].response, assert.fail);
  await createEvent({ body: { title: "New" }, user: { id: "owner" } }, responses[2].response, assert.fail);
  await updateEvent(
    { params: { id: "one" }, body: { title: "Updated" } },
    responses[3].response,
    assert.fail,
  );
  await changeEventStatus(
    { params: { id: "one" }, body: { status: "published" } },
    responses[4].response,
    assert.fail,
  );

  assert.deepEqual(
    responses.map(({ result }) => result.statusCode),
    [200, 200, 201, 200, 200],
  );
});

test("events controller maps domain errors", async (context) => {
  const originalGetEvents = eventsService.getEvents;
  context.after(() => {
    eventsService.getEvents = originalGetEvents;
  });

  const cases = [
    [new EventValidationError("invalid"), 400],
    [new EventNotFoundError(), 404],
  ];

  for (const [error, expectedStatus] of cases) {
    eventsService.getEvents = async () => {
      throw error;
    };
    const { response, result } = createResponse();
    await getEvents({}, response, assert.fail);
    assert.equal(result.statusCode, expectedStatus);
  }
});

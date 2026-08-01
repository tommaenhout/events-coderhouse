import assert from "node:assert/strict";
import test from "node:test";

import { createEventsController } from "../src/controllers/events.controller.js";
import {
  EventNotFoundError,
  EventValidationError,
} from "../src/services/events.service.js";

const createResponse = () => {
  const result = {};
  const response = {
    status(statusCode) {
      result.statusCode = statusCode;
      return this;
    },
    json(body) {
      result.body = body;
      return this;
    },
  };

  return { response, result };
};

test("getEvents uses the injected service", async () => {
  const expectedEvents = [{ title: "Injected event" }];
  const eventService = { getEvents: async () => expectedEvents };
  const controller = createEventsController({ eventService });
  const { response, result } = createResponse();

  await controller.getEvents({}, response, assert.fail);

  assert.deepEqual(result, {
    statusCode: 200,
    body: { status: "success", payload: expectedEvents },
  });
});

test("controller forwards unexpected service errors", async () => {
  const expectedError = new Error("database unavailable");
  const eventService = {
    async getEvents() {
      throw expectedError;
    },
  };
  const controller = createEventsController({ eventService });
  let forwardedError;

  await controller.getEvents({}, {}, (error) => {
    forwardedError = error;
  });

  assert.equal(forwardedError, expectedError);
});

test("getEventById returns an event", async () => {
  const expectedEvent = { _id: "event-id", title: "Conference" };
  const eventService = {
    async getEventById(id) {
      assert.equal(id, "event-id");
      return expectedEvent;
    },
  };
  const controller = createEventsController({ eventService });
  const { response, result } = createResponse();

  await controller.getEventById(
    { params: { id: "event-id" } },
    response,
    assert.fail,
  );

  assert.deepEqual(result, {
    statusCode: 200,
    body: { status: "success", payload: expectedEvent },
  });
});

test("controller maps missing events to 404", async () => {
  const eventService = {
    async getEventById() {
      throw new EventNotFoundError();
    },
  };
  const controller = createEventsController({ eventService });
  const { response, result } = createResponse();

  await controller.getEventById({ params: { id: "missing" } }, response, assert.fail);

  assert.deepEqual(result, {
    statusCode: 404,
    body: { status: "error", message: "Evento no encontrado" },
  });
});

test("createEvent passes request data to the service", async () => {
  const requestBody = {
    title: "Conference",
    date: "2026-09-01T18:00:00.000Z",
  };
  const expectedEvent = { _id: "event-id", ...requestBody };
  const eventService = {
    async createEvent(eventData) {
      assert.equal(eventData, requestBody);
      return expectedEvent;
    },
  };
  const controller = createEventsController({ eventService });
  const { response, result } = createResponse();

  await controller.createEvent({ body: requestBody }, response, assert.fail);

  assert.deepEqual(result, {
    statusCode: 201,
    body: { status: "success", payload: expectedEvent },
  });
});

test("controller maps service validation errors to 400", async () => {
  const eventService = {
    async createEvent() {
      throw new EventValidationError("Datos inválidos");
    },
  };
  const controller = createEventsController({ eventService });
  const { response, result } = createResponse();

  await controller.createEvent({ body: {} }, response, assert.fail);

  assert.deepEqual(result, {
    statusCode: 400,
    body: { status: "error", message: "Datos inválidos" },
  });
});

test("updateEvent and deleteEvent pass IDs to the service", async () => {
  const calls = [];
  const eventService = {
    async updateEvent(id, data) {
      calls.push(["updateEvent", id, data]);
      return { _id: id, ...data };
    },
    async deleteEvent(id) {
      calls.push(["deleteEvent", id]);
      return { _id: id };
    },
  };
  const controller = createEventsController({ eventService });
  const updateResponse = createResponse();
  const deleteResponse = createResponse();

  await controller.updateEvent(
    { params: { id: "event-id" }, body: { title: "Updated" } },
    updateResponse.response,
    assert.fail,
  );
  await controller.deleteEvent(
    { params: { id: "event-id" } },
    deleteResponse.response,
    assert.fail,
  );

  assert.deepEqual(calls, [
    ["updateEvent", "event-id", { title: "Updated" }],
    ["deleteEvent", "event-id"],
  ]);
  assert.equal(updateResponse.result.statusCode, 200);
  assert.equal(deleteResponse.result.statusCode, 200);
});

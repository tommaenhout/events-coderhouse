import assert from "node:assert/strict";
import test from "node:test";

import { createEventsController } from "../src/controllers/events.controller.js";

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

test("getEvents uses the injected repository", async () => {
  const expectedEvents = [{ title: "Injected event" }];
  const eventRepository = {
    async findAll() {
      return expectedEvents;
    },
  };
  const controller = createEventsController({ eventRepository });
  const { response, result } = createResponse();

  await controller.getEvents({}, response, assert.fail);

  assert.deepEqual(result, {
    statusCode: 200,
    body: { status: "success", payload: expectedEvents },
  });
});

test("getEvents forwards repository errors", async () => {
  const expectedError = new Error("database unavailable");
  const eventRepository = {
    async findAll() {
      throw expectedError;
    },
  };
  const controller = createEventsController({ eventRepository });
  let forwardedError;

  await controller.getEvents({}, {}, (error) => {
    forwardedError = error;
  });

  assert.equal(forwardedError, expectedError);
});

test("getEventById returns an event", async () => {
  const expectedEvent = { _id: "event-id", title: "Conference" };
  const eventRepository = {
    async findById(id) {
      assert.equal(id, "event-id");
      return expectedEvent;
    },
  };
  const controller = createEventsController({ eventRepository });
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

test("getEventById returns 404 when the event does not exist", async () => {
  const controller = createEventsController({
    eventRepository: { findById: async () => null },
  });
  const { response, result } = createResponse();

  await controller.getEventById({ params: { id: "missing" } }, response, assert.fail);

  assert.deepEqual(result, {
    statusCode: 404,
    body: { status: "error", message: "Evento no encontrado" },
  });
});

test("createEvent validates and creates an event", async () => {
  const requestBody = {
    title: "Conference",
    date: "2026-09-01T18:00:00.000Z",
    ignored: "not persisted",
  };
  const expectedEvent = { _id: "event-id", ...requestBody };
  delete expectedEvent.ignored;
  const eventRepository = {
    async create(eventData) {
      assert.deepEqual(eventData, {
        title: requestBody.title,
        date: requestBody.date,
      });
      return expectedEvent;
    },
  };
  const controller = createEventsController({ eventRepository });
  const { response, result } = createResponse();

  await controller.createEvent({ body: requestBody }, response, assert.fail);

  assert.deepEqual(result, {
    statusCode: 201,
    body: { status: "success", payload: expectedEvent },
  });
});

test("createEvent rejects missing required fields", async () => {
  const controller = createEventsController({ eventRepository: {} });
  const { response, result } = createResponse();

  await controller.createEvent({ body: { title: "Conference" } }, response, assert.fail);

  assert.deepEqual(result, {
    statusCode: 400,
    body: {
      status: "error",
      message: "Los campos title y date son obligatorios",
    },
  });
});

test("updateEvent updates only accepted fields", async () => {
  const updatedEvent = { _id: "event-id", title: "Updated" };
  const eventRepository = {
    async updateById(id, eventData) {
      assert.equal(id, "event-id");
      assert.deepEqual(eventData, { title: "Updated" });
      return updatedEvent;
    },
  };
  const controller = createEventsController({ eventRepository });
  const { response, result } = createResponse();

  await controller.updateEvent(
    { params: { id: "event-id" }, body: { title: "Updated", owner: "ignored" } },
    response,
    assert.fail,
  );

  assert.deepEqual(result, {
    statusCode: 200,
    body: { status: "success", payload: updatedEvent },
  });
});

test("deleteEvent deletes and returns the event", async () => {
  const deletedEvent = { _id: "event-id", title: "Conference" };
  const eventRepository = {
    async deleteById(id) {
      assert.equal(id, "event-id");
      return deletedEvent;
    },
  };
  const controller = createEventsController({ eventRepository });
  const { response, result } = createResponse();

  await controller.deleteEvent(
    { params: { id: "event-id" } },
    response,
    assert.fail,
  );

  assert.deepEqual(result, {
    statusCode: 200,
    body: { status: "success", payload: deletedEvent },
  });
});

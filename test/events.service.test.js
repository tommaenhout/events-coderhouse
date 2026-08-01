import assert from "node:assert/strict";
import test from "node:test";

import {
  EventNotFoundError,
  EventValidationError,
  createEventsService,
} from "../src/services/events.service.js";

test("event service delegates all CRUD use cases to the repository", async () => {
  const calls = [];
  const eventRepository = {
    async findAll() {
      calls.push(["findAll"]);
      return ["all"];
    },
    async findById(id) {
      calls.push(["findById", id]);
      return { id };
    },
    async create(data) {
      calls.push(["create", data]);
      return { id: "created", ...data };
    },
    async updateById(id, data) {
      calls.push(["updateById", id, data]);
      return { id, ...data };
    },
    async deleteById(id) {
      calls.push(["deleteById", id]);
      return { id };
    },
  };
  const service = createEventsService({ eventRepository });
  const data = { title: "Conference", date: "2026-09-01T18:00:00.000Z" };

  assert.deepEqual(await service.getEvents(), ["all"]);
  assert.deepEqual(await service.getEventById("one"), { id: "one" });
  assert.deepEqual(await service.createEvent({ ...data, ignored: true }), {
    id: "created",
    ...data,
  });
  assert.deepEqual(await service.updateEvent("one", { title: "Updated" }), {
    id: "one",
    title: "Updated",
  });
  assert.deepEqual(await service.deleteEvent("one"), { id: "one" });

  assert.deepEqual(calls, [
    ["findAll"],
    ["findById", "one"],
    ["create", data],
    ["updateById", "one", { title: "Updated" }],
    ["deleteById", "one"],
  ]);
});

test("event service rejects invalid creation data", () => {
  const service = createEventsService({ eventRepository: {} });

  assert.throws(
    () => service.createEvent({ title: "Missing date" }),
    (error) =>
      error instanceof EventValidationError &&
      error.message === "Los campos title y date son obligatorios",
  );
});

test("event service reports missing events", async () => {
  const service = createEventsService({
    eventRepository: { findById: async () => null },
  });

  await assert.rejects(
    service.getEventById("missing"),
    EventNotFoundError,
  );
});

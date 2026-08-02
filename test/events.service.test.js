import assert from "node:assert/strict";
import test from "node:test";

import eventsRepository from "../src/repositories/events.repository.js";
import eventsService, {
  EventNotFoundError,
  EventValidationError,
} from "../src/services/events.service.js";

const stubRepository = (context, stubs) => {
  const originals = {};
  for (const [method, implementation] of Object.entries(stubs)) {
    originals[method] = eventsRepository[method];
    eventsRepository[method] = implementation;
  }
  context.after(() => Object.assign(eventsRepository, originals));
};

test("events service validates and delegates event creation", async (context) => {
  let persistedData;
  stubRepository(context, {
    create: async (data) => {
      persistedData = data;
      return { id: "new", ...data };
    },
  });

  const event = await eventsService.createEvent({
    title: "Conference",
    date: "2026-09-01T18:00:00.000Z",
    ignored: true,
  });

  assert.deepEqual(persistedData, {
    title: "Conference",
    date: "2026-09-01T18:00:00.000Z",
  });
  assert.equal(event.id, "new");
});

test("events service reports validation and not-found errors", async (context) => {
  assert.throws(
    () => eventsService.createEvent({ title: "Missing date" }),
    EventValidationError,
  );

  stubRepository(context, { findById: async () => null });
  await assert.rejects(eventsService.getEventById("missing"), EventNotFoundError);
});

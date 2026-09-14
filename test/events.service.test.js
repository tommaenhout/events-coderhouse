import assert from "node:assert/strict";
import test from "node:test";

import eventsRepository from "../src/repositories/events.repository.js";
import eventsService, {
  EventNotFoundError,
  EventValidationError,
} from "../src/services/events.service.js";

const eventId = "507f1f77bcf86cd799439011";
const futureDate = "2099-09-01T18:00:00.000Z";
const validEventData = {
  title: "Conference",
  description: "A technology conference",
  category: "Technology",
  date: futureDate,
  location: "Buenos Aires",
  capacity: 100,
  price: 0,
};

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
    ...validEventData,
    ignored: true,
    organizer: "someone-else",
  }, "owner");

  assert.deepEqual(persistedData, {
    ...validEventData,
    date: new Date(futureDate),
    status: "draft",
    organizer: "owner",
  });
  assert.equal(event.id, "new");
});

test("event updates cannot change the organizer", async (context) => {
  stubRepository(context, {
    findById: async () => ({ id: eventId, status: "draft" }),
    updateById: async (id, data) => {
      assert.deepEqual(data, { title: "Updated" });
      return { id, ...data, organizer: "owner" };
    },
  });
  const event = await eventsService.updateEvent(eventId, {
    title: "Updated",
    organizer: "someone-else",
  });
  assert.equal(event.organizer, "owner");
  await assert.rejects(
    eventsService.updateEvent(eventId, { organizer: "someone-else" }),
    EventValidationError,
  );
});

test("events service reports validation and not-found errors", async (context) => {
  assert.throws(
    () => eventsService.createEvent({ title: "Missing date" }),
    EventValidationError,
  );

  stubRepository(context, { findById: async () => null });
  await assert.rejects(eventsService.getEventById(eventId), EventNotFoundError);
});

test("events service validates ids, capacity, price, and status", async () => {
  await assert.rejects(
    eventsService.getEventById("invalid-id"),
    (error) =>
      error instanceof EventValidationError &&
      error.message === "ID de evento inválido",
  );

  assert.throws(
    () =>
      eventsService.createEvent({
        ...validEventData,
        capacity: 0,
      }),
    /La capacidad debe ser mayor que 0/,
  );

  assert.throws(
    () =>
      eventsService.createEvent({
        ...validEventData,
        price: -1,
      }),
    /El precio no puede ser negativo/,
  );

  assert.throws(
    () =>
      eventsService.createEvent({
        ...validEventData,
        status: "archived",
      }),
    /Status inválido/,
  );
});

test("events service rejects past dates", () => {
  assert.throws(
    () => eventsService.createEvent({
      ...validEventData,
      date: "2020-01-01T00:00:00.000Z",
    }),
    /no puede estar en el pasado/,
  );
});

test("events service filters, paginates, and sorts event listings", async (context) => {
  const from = "2099-01-01T00:00:00.000Z";
  const to = "2099-12-31T23:59:59.999Z";

  stubRepository(context, {
    findAll: async (filter, options) => {
      assert.deepEqual(filter, {
        status: "published",
        category: { $regex: "workshop", $options: "i" },
        location: { $regex: "buenos aires", $options: "i" },
        date: { $gte: new Date(from), $lte: new Date(to) },
      });
      assert.deepEqual(options, {
        skip: 5,
        limit: 5,
        sort: { date: -1 },
      });
      return [{ id: eventId }];
    },
    count: async () => 12,
  });

  const result = await eventsService.getEvents({
    status: "published",
    category: "workshop",
    location: "buenos aires",
    dateFrom: from,
    dateTo: to,
    page: "2",
    limit: "5",
    sort: "-date",
  });

  assert.deepEqual(result, {
    data: [{ id: eventId }],
    page: 2,
    limit: 5,
    total: 12,
    totalPages: 3,
  });
});

test("cancelled events cannot be updated or change status", async (context) => {
  stubRepository(context, {
    findById: async () => ({ id: eventId, status: "cancelled" }),
  });

  await assert.rejects(
    eventsService.updateEvent(eventId, { title: "Updated" }),
    /Un evento cancelado no puede modificarse/,
  );
  await assert.rejects(
    eventsService.changeStatus(eventId, "published"),
    /Un evento cancelado no puede cambiar de estado/,
  );
});

test("finished events cannot be published", async (context) => {
  stubRepository(context, {
    findById: async () => ({ id: eventId, status: "finished" }),
  });

  await assert.rejects(
    eventsService.changeStatus(eventId, "published"),
    /No se puede publicar un evento finalizado/,
  );
});

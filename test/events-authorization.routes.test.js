import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";

import app from "../src/app.js";
import { Event } from "../src/models/event.model.js";
import eventsService, { EventNotFoundError } from "../src/services/events.service.js";
import { generateJWT } from "../src/utils/jwt.js";

const users = {
  user: {
    id: "507f1f77bcf86cd799439011",
    email: "user@example.com",
    role: "user",
  },
  owner: {
    id: "507f1f77bcf86cd799439012",
    email: "owner@example.com",
    role: "organizer",
  },
  otherOrganizer: {
    id: "507f1f77bcf86cd799439013",
    email: "other@example.com",
    role: "organizer",
  },
  admin: {
    id: "507f1f77bcf86cd799439014",
    email: "admin@example.com",
    role: "admin",
  },
};

const eventId = "507f1f77bcf86cd799439015";
const missingEventId = "507f1f77bcf86cd799439016";

const request = (baseUrl, path, { method, user, body } = {}) => {
  const headers = {};

  if (user) {
    headers.cookie = `currentUser=${generateJWT(user)}`;
  }

  if (body) {
    headers["content-type"] = "application/json";
  }

  return fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
};

test("event routes enforce authentication, roles and ownership", async (context) => {
  const originalCreateEvent = eventsService.createEvent;
  const originalGetEventById = eventsService.getEventById;
  const originalUpdateEvent = eventsService.updateEvent;
  const originalChangeStatus = eventsService.changeStatus;
  const originalFindById = Event.findById;

  eventsService.createEvent = async (data, organizerId) => ({
    id: "event-id",
    ...data,
    organizer: organizerId,
  });
  eventsService.getEventById = async (id) => {
    if (id === missingEventId) throw new EventNotFoundError();
    return { id, title: "Public event" };
  };
  eventsService.updateEvent = async (id, data) => ({ id, ...data });
  eventsService.changeStatus = async (id, status) => ({ id, status });
  Event.findById = async () => ({ organizer: users.owner.id });

  context.after(() => {
    eventsService.createEvent = originalCreateEvent;
    eventsService.getEventById = originalGetEventById;
    eventsService.updateEvent = originalUpdateEvent;
    eventsService.changeStatus = originalChangeStatus;
    Event.findById = originalFindById;
  });

  const server = app.listen(0, "127.0.0.1");
  try {
    await once(server, "listening");
    const baseUrl = `http://127.0.0.1:${server.address().port}`;

    const publicEvent = await request(baseUrl, `/api/events/${eventId}`);
    assert.equal(publicEvent.status, 200);

    const missingEvent = await request(baseUrl, `/api/events/${missingEventId}`);
    assert.equal(missingEvent.status, 404);

    const eventData = {
      title: "Congreso Tech 2026",
      description: "Conferencia para desarrolladores",
      category: "Technology",
      date: "2099-10-10T18:00:00.000Z",
      location: "Buenos Aires",
      capacity: 100,
      price: 0,
    };

    const unauthenticated = await request(baseUrl, "/api/events", {
      method: "POST",
      body: eventData,
    });
    assert.equal(unauthenticated.status, 401);
    assert.deepEqual(await unauthenticated.json(), {
      status: "error",
      message: "No autenticado",
    });

    const forbiddenCreation = await request(baseUrl, "/api/events", {
      method: "POST",
      user: users.user,
      body: eventData,
    });
    assert.equal(forbiddenCreation.status, 403);
    assert.deepEqual(await forbiddenCreation.json(), {
      status: "error",
      message: "Acceso denegado",
    });

    const organizerCreation = await request(baseUrl, "/api/events", {
      method: "POST",
      user: users.owner,
      body: eventData,
    });
    assert.equal(organizerCreation.status, 201);
    assert.deepEqual(await organizerCreation.json(), {
      status: "success",
      payload: {
        id: "event-id",
        ...eventData,
        organizer: users.owner.id,
      },
    });

    const ownerUpdate = await request(baseUrl, `/api/events/${eventId}`, {
      method: "PUT",
      user: users.owner,
      body: { title: "Evento actualizado" },
    });
    assert.equal(ownerUpdate.status, 200);

    const forbiddenUpdate = await request(baseUrl, `/api/events/${eventId}`, {
      method: "PUT",
      user: users.otherOrganizer,
      body: { title: "Intento ajeno" },
    });
    assert.equal(forbiddenUpdate.status, 403);
    assert.deepEqual(await forbiddenUpdate.json(), {
      status: "error",
      message: "Acceso denegado",
    });

    const adminUpdate = await request(baseUrl, `/api/events/${eventId}`, {
      method: "PUT",
      user: users.admin,
      body: { title: "Cambio administrativo" },
    });
    assert.equal(adminUpdate.status, 200);

    const ownerStatusChange = await request(baseUrl, `/api/events/${eventId}/status`, {
      method: "PATCH",
      user: users.owner,
      body: { status: "cancelled" },
    });
    assert.equal(ownerStatusChange.status, 200);
    assert.deepEqual(await ownerStatusChange.json(), {
      status: "success",
      payload: { id: eventId, status: "cancelled" },
    });
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
      server.closeAllConnections();
    });
  }
});

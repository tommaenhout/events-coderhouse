import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";

import app from "../src/app.js";
import ticketService from "../src/services/ticket.service.js";
import { generateJWT } from "../src/utils/jwt.js";

const users = {
  attendee: { id: "user-id", email: "user@example.com", role: "user" },
  organizer: { id: "organizer-id", email: "organizer@example.com", role: "organizer" },
};

const request = (baseUrl, path, { method = "GET", user, body } = {}) => {
  const headers = {};
  if (user) headers.cookie = `currentUser=${generateJWT(user)}`;
  if (body) headers["content-type"] = "application/json";
  return fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
};

test("ticket routes enforce authentication and expose the existing HTTP contract", async (context) => {
  const originals = {};
  for (const method of ["enroll", "getTicketsFromUser", "getTicketsByEvent", "cancelTicket"]) {
    originals[method] = ticketService[method];
  }
  ticketService.enroll = async (user, eventId, quantity) => ({
    _id: "ticket-id",
    user: user.id,
    event: eventId,
    quantity,
    status: "confirmed",
    reservationCode: "CODE-123",
  });
  ticketService.getTicketsFromUser = async (user) => [{
    _id: "ticket-id",
    user: user.id,
    event: "event-id",
    status: "confirmed",
  }];
  ticketService.getTicketsByEvent = async () => [];
  ticketService.cancelTicket = async (user, ticketId) => ({
    _id: ticketId,
    user: user.id,
    event: "event-id",
    status: "cancelled",
  });
  context.after(() => Object.assign(ticketService, originals));

  const server = app.listen(0, "127.0.0.1");
  context.after(() => server.close());
  await once(server, "listening");
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  const unauthenticated = await request(baseUrl, "/api/tickets/my-tickets");
  assert.equal(unauthenticated.status, 401);

  const enrollment = await request(baseUrl, "/api/tickets/event/event-id/enroll", {
    method: "POST",
    user: users.attendee,
    body: { quantity: 2 },
  });
  assert.equal(enrollment.status, 201);
  assert.deepEqual((await enrollment.json()).data, {
    id: "ticket-id",
    event: "event-id",
    quantity: 2,
    status: "confirmed",
    reservationCode: "CODE-123",
  });

  const ownTickets = await request(baseUrl, "/api/tickets/my-tickets", {
    user: users.attendee,
  });
  assert.equal(ownTickets.status, 200);

  const forbiddenAttendees = await request(baseUrl, "/api/tickets/event/event-id/tickets", {
    user: users.attendee,
  });
  assert.equal(forbiddenAttendees.status, 403);

  const organizerAttendees = await request(baseUrl, "/api/tickets/event/event-id/tickets", {
    user: users.organizer,
  });
  assert.equal(organizerAttendees.status, 200);

  const cancellation = await request(baseUrl, "/api/tickets/ticket-id/cancel", {
    method: "PATCH",
    user: users.attendee,
  });
  assert.equal(cancellation.status, 200);
  assert.equal((await cancellation.json()).data.status, "cancelled");
});

test("ticket routes preserve business error status codes", async (context) => {
  const original = ticketService.enroll;
  ticketService.enroll = async () => {
    throw Object.assign(new Error("El usuario ya tiene un ticket confirmado"), {
      statusCode: 409,
    });
  };
  context.after(() => { ticketService.enroll = original; });

  const server = app.listen(0, "127.0.0.1");
  context.after(() => server.close());
  await once(server, "listening");
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  const response = await request(baseUrl, "/api/tickets/event/event-id/enroll", {
    method: "POST",
    user: users.attendee,
    body: { quantity: 1 },
  });

  assert.equal(response.status, 409);
  assert.deepEqual(await response.json(), {
    status: "error",
    message: "El usuario ya tiene un ticket confirmado",
  });
});

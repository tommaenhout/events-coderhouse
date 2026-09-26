import assert from "node:assert/strict";
import test from "node:test";

import ticketService from "../src/services/ticket.service.js";

const eventId = "507f1f77bcf86cd799439011";
const ticketId = "507f1f77bcf86cd799439012";
const user = { id: "user-id", email: "user@example.com", role: "user" };
const futureEvent = {
  _id: eventId,
  title: "Tech Day",
  date: "2099-10-10T18:00:00.000Z",
  status: "published",
  organizer: "organizer-id",
};

const stubDependencies = (context, groups) => {
  const targets = {
    ticket: ticketService.ticketRepository,
    events: ticketService.eventsRepository,
    email: ticketService.emailService,
  };
  const originals = [];
  for (const [group, stubs] of Object.entries(groups)) {
    for (const [method, implementation] of Object.entries(stubs)) {
      const target = targets[group];
      originals.push([target, method, target[method]]);
      target[method] = implementation;
    }
  }
  context.after(() => {
    for (const [target, method, original] of originals) target[method] = original;
  });
};

test("ticket service enrolls, reserves seats and sends confirmation", async (context) => {
  const calls = [];
  stubDependencies(context, {
    ticket: {
      isValidId: () => true,
      findByUserAndEvent: async () => null,
      create: async (data) => {
        calls.push(["create", data]);
        return { _id: ticketId, ...data };
      },
    },
    events: {
      findById: async () => futureEvent,
      reserveSeats: async (id, seats) => {
        calls.push(["reserve", id, seats]);
        return { ...futureEvent, reserved: seats };
      },
    },
    email: {
      sendTicketConfirmationEmail: async (...args) => calls.push(["email", ...args]),
    },
  });

  const ticket = await ticketService.enroll(user, eventId, "2");

  assert.equal(ticket.status, "confirmed");
  assert.equal(ticket.quantity, 2);
  assert.equal(ticket.user, user.id);
  assert.match(ticket.reservationCode, /\S+/);
  assert.deepEqual(calls[0], ["reserve", eventId, 2]);
  assert.equal(calls[1][0], "create");
  assert.equal(calls[2][0], "email");
});

test("ticket service validates ids and quantities", async (context) => {
  stubDependencies(context, { ticket: { isValidId: (id) => id !== "invalid" } });

  await assert.rejects(
    ticketService.enroll(user, "invalid", 1),
    (error) => error.statusCode === 400 && /ID de ticket/.test(error.message),
  );
  for (const quantity of [0, -1, 1.5, "abc"]) {
    await assert.rejects(
      ticketService.enroll(user, eventId, quantity),
      (error) => error.statusCode === 400 && /cantidad/.test(error.message),
    );
  }
});

test("ticket service rejects missing, unpublished and expired events", async (context) => {
  let currentEvent = null;
  stubDependencies(context, {
    ticket: { isValidId: () => true },
    events: { findById: async () => currentEvent },
  });

  await assert.rejects(
    ticketService.enroll(user, eventId, 1),
    (error) => error.statusCode === 404,
  );

  currentEvent = { ...futureEvent, status: "draft" };
  await assert.rejects(
    ticketService.enroll(user, eventId, 1),
    (error) => error.statusCode === 400 && /publicado/.test(error.message),
  );

  currentEvent = { ...futureEvent, date: "2020-01-01T00:00:00.000Z" };
  await assert.rejects(
    ticketService.enroll(user, eventId, 1),
    (error) => error.statusCode === 400 && /ocurrido/.test(error.message),
  );
});

test("ticket service reports duplicate enrollment as a conflict", async (context) => {
  let reserved = false;
  stubDependencies(context, {
    ticket: {
      isValidId: () => true,
      findByUserAndEvent: async () => ({ _id: ticketId }),
    },
    events: {
      findById: async () => futureEvent,
      reserveSeats: async () => { reserved = true; },
    },
  });

  await assert.rejects(
    ticketService.enroll(user, eventId, 1),
    (error) => error.statusCode === 409,
  );
  assert.equal(reserved, false);
});

test("ticket service rejects enrollment when capacity cannot be reserved", async (context) => {
  stubDependencies(context, {
    ticket: {
      isValidId: () => true,
      findByUserAndEvent: async () => null,
    },
    events: {
      findById: async () => futureEvent,
      reserveSeats: async () => null,
    },
  });

  await assert.rejects(
    ticketService.enroll(user, eventId, 2),
    (error) => error.statusCode === 400 && /asientos/.test(error.message),
  );
});

test("ticket service releases reserved seats when ticket creation fails", async (context) => {
  const releases = [];
  stubDependencies(context, {
    ticket: {
      isValidId: () => true,
      findByUserAndEvent: async () => null,
      create: async () => { throw new Error("database unavailable"); },
    },
    events: {
      findById: async () => futureEvent,
      reserveSeats: async () => futureEvent,
      releaseSeats: async (...args) => releases.push(args),
    },
  });

  await assert.rejects(
    ticketService.enroll(user, eventId, 3),
    (error) => error.statusCode === 500,
  );
  assert.deepEqual(releases, [[eventId, 3]]);
});

test("ticket service lists only the authenticated user's tickets", async (context) => {
  let receivedUserId;
  stubDependencies(context, {
    ticket: {
      findByUser: async (userId) => {
        receivedUserId = userId;
        return [{ _id: ticketId }];
      },
    },
  });

  assert.deepEqual(await ticketService.getTicketsFromUser(user), [{ _id: ticketId }]);
  assert.equal(receivedUserId, user.id);
});

test("ticket service allows only the event owner or an admin to list attendees", async (context) => {
  let event = { ...futureEvent, organizer: { _id: "organizer-id" } };
  stubDependencies(context, {
    ticket: {
      isValidId: () => true,
      findByEvent: async () => [{ _id: ticketId }],
    },
    events: { findById: async () => event },
  });

  assert.deepEqual(
    await ticketService.getTicketsByEvent(eventId, { id: "organizer-id", role: "organizer" }),
    [{ _id: ticketId }],
  );
  assert.deepEqual(
    await ticketService.getTicketsByEvent(eventId, { id: "admin-id", role: "admin" }),
    [{ _id: ticketId }],
  );
  await assert.rejects(
    ticketService.getTicketsByEvent(eventId, { id: "other-id", role: "organizer" }),
    (error) => error.statusCode === 403,
  );

  event = null;
  await assert.rejects(
    ticketService.getTicketsByEvent(eventId, { id: "admin-id", role: "admin" }),
    (error) => error.statusCode === 404,
  );
});

test("ticket service cancels an owned ticket, releases seats and sends email", async (context) => {
  const calls = [];
  const existing = {
    _id: ticketId,
    user: user.id,
    event: futureEvent,
    quantity: 2,
    status: "confirmed",
  };
  const cancelled = { ...existing, status: "cancelled" };
  stubDependencies(context, {
    ticket: {
      isValidId: () => true,
      findById: async () => existing,
      cancelTicket: async (id, at) => {
        calls.push(["cancel", id, at]);
        return cancelled;
      },
    },
    events: {
      releaseSeats: async (...args) => calls.push(["release", ...args]),
    },
    email: {
      sendTicketCancellation: async (...args) => calls.push(["email", ...args]),
    },
  });

  assert.equal((await ticketService.cancelTicket(user, ticketId)).status, "cancelled");
  assert.equal(calls[0][0], "cancel");
  assert.ok(calls[0][2] instanceof Date);
  assert.deepEqual(calls[1], ["release", eventId, 2]);
  assert.equal(calls[2][0], "email");
});

test("ticket cancellation enforces existence, ownership and state", async (context) => {
  let existing = null;
  stubDependencies(context, {
    ticket: {
      isValidId: () => true,
      findById: async () => existing,
      cancelTicket: async () => ({ status: "cancelled" }),
    },
    events: { releaseSeats: async () => {} },
    email: { sendTicketCancellation: async () => {} },
  });

  await assert.rejects(
    ticketService.cancelTicket(user, ticketId),
    (error) => error.statusCode === 404,
  );

  existing = { user: "other-id", event: futureEvent, quantity: 1, status: "confirmed" };
  await assert.rejects(
    ticketService.cancelTicket(user, ticketId),
    (error) => error.statusCode === 403,
  );

  existing = { ...existing, user: user.id, status: "cancelled" };
  await assert.rejects(
    ticketService.cancelTicket(user, ticketId),
    (error) => error.statusCode === 400 && /cancelado/.test(error.message),
  );

  existing = { ...existing, user: "other-id", status: "confirmed" };
  const result = await ticketService.cancelTicket({ ...user, role: "admin" }, ticketId);
  assert.equal(result.status, "cancelled");
});

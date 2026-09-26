import assert from "node:assert/strict";
import test from "node:test";

import {
  cancelTicket,
  enroll,
  getTicketsByEvent,
  getTicketsFromUser,
} from "../src/controllers/tickets.controller.js";
import ticketService from "../src/services/ticket.service.js";

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
        return this;
      },
    },
  };
};

const stubService = (context, method, implementation) => {
  const original = ticketService[method];
  ticketService[method] = implementation;
  context.after(() => { ticketService[method] = original; });
};

test("enroll controller delegates input and returns the enrollment DTO", async (context) => {
  let received;
  stubService(context, "enroll", async (...args) => {
    received = args;
    return {
      _id: "ticket-id",
      user: "user-id",
      event: "event-id",
      quantity: 2,
      status: "confirmed",
      reservationCode: "CODE-123",
      password: "must-not-leak",
    };
  });
  const { response, result } = createResponse();
  const user = { id: "user-id" };

  await enroll(
    { user, params: { eid: "event-id" }, body: { quantity: 2 } },
    response,
    assert.fail,
  );

  assert.deepEqual(received, [user, "event-id", 2]);
  assert.equal(result.statusCode, 201);
  assert.deepEqual({ ...result.body.data }, {
    id: "ticket-id",
    event: "event-id",
    quantity: 2,
    status: "confirmed",
    reservationCode: "CODE-123",
  });
  assert.equal(JSON.stringify(result.body).includes("password"), false);
});

test("my-tickets controller returns ticket DTOs with safe populated data", async (context) => {
  stubService(context, "getTicketsFromUser", async () => [{
    _id: "ticket-id",
    user: "user-id",
    event: {
      _id: "event-id",
      title: "Tech Day",
      organizer: {
        _id: "organizer-id",
        email: "organizer@example.com",
        password: "organizer-hash",
      },
    },
    status: "confirmed",
    quantity: 1,
    reservationCode: "CODE-123",
  }]);
  const { response, result } = createResponse();

  await getTicketsFromUser({ user: { id: "user-id" } }, response, assert.fail);

  assert.equal(result.statusCode, 200);
  assert.equal(result.body.data.length, 1);
  assert.equal(result.body.data[0].event.title, "Tech Day");
  assert.equal(JSON.stringify(result.body).includes("password"), false);
  assert.equal(JSON.stringify(result.body).includes("organizer-hash"), false);
});

test("event tickets controller passes the authenticated actor to the service", async (context) => {
  let received;
  stubService(context, "getTicketsByEvent", async (...args) => {
    received = args;
    return [{
      _id: "ticket-id",
      user: {
        _id: "user-id",
        first_name: "Ada",
        last_name: "Lovelace",
        email: "ada@example.com",
        password: "user-hash",
      },
      event: "event-id",
      status: "confirmed",
    }];
  });
  const { response, result } = createResponse();
  const actor = { id: "organizer-id", role: "organizer" };

  await getTicketsByEvent(
    { user: actor, params: { eid: "event-id" } },
    response,
    assert.fail,
  );

  assert.deepEqual(received, ["event-id", actor]);
  assert.equal(result.statusCode, 200);
  assert.equal(result.body.data[0].user.email, "ada@example.com");
  assert.equal(JSON.stringify(result.body).includes("user-hash"), false);
});

test("cancel controller returns a safe cancelled ticket DTO", async (context) => {
  const actor = { id: "user-id", role: "user" };
  let received;
  stubService(context, "cancelTicket", async (...args) => {
    received = args;
    return {
      _id: "ticket-id",
      user: "user-id",
      event: "event-id",
      quantity: 1,
      status: "cancelled",
      cancelledAt: new Date("2026-09-26T12:00:00.000Z"),
    };
  });
  const { response, result } = createResponse();

  await cancelTicket(
    { user: actor, params: { tid: "ticket-id" } },
    response,
    assert.fail,
  );

  assert.deepEqual(received, [actor, "ticket-id"]);
  assert.equal(result.statusCode, 200);
  assert.equal(result.body.data.status, "cancelled");
});

test("ticket controllers forward service errors to the centralized handler", async (context) => {
  const expected = Object.assign(new Error("conflict"), { statusCode: 409 });
  stubService(context, "enroll", async () => { throw expected; });
  let forwarded;

  await enroll(
    { user: { id: "user-id" }, params: { eid: "event-id" }, body: { quantity: 1 } },
    createResponse().response,
    (error) => { forwarded = error; },
  );

  assert.equal(forwarded, expected);
});

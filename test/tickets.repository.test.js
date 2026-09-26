import assert from "node:assert/strict";
import test from "node:test";

import ticketsDao from "../src/dao/tickets.dao.js";
import ticketRepository from "../src/repositories/ticket.repository.js";

test("tickets repository delegates access operations to the DAO", async (context) => {
  const calls = [];
  const originals = {};
  const methods = [
    "create",
    "isValidId",
    "findByUserAndEvent",
    "findById",
    "findByUser",
    "findByEvent",
    "sumReservedByEvent",
  ];
  for (const method of methods) {
    originals[method] = ticketsDao[method];
    ticketsDao[method] = (...args) => {
      calls.push([method, ...args]);
      return method === "isValidId" ? true : method;
    };
  }
  context.after(() => Object.assign(ticketsDao, originals));

  assert.equal(ticketRepository.isValidId("ticket-id"), true);
  assert.equal(await ticketRepository.create({ quantity: 1 }), "create");
  assert.equal(
    await ticketRepository.findByUserAndEvent("user-id", "event-id", "confirmed"),
    "findByUserAndEvent",
  );
  assert.equal(await ticketRepository.findById("ticket-id"), "findById");
  assert.equal(await ticketRepository.findByUser("user-id"), "findByUser");
  assert.equal(await ticketRepository.findByEvent("event-id"), "findByEvent");
  assert.equal(await ticketRepository.countActiveTickets("event-id"), "sumReservedByEvent");
  assert.equal(calls.length, 7);
});

test("tickets repository translates cancellation into an update", async (context) => {
  const original = ticketsDao.updateById;
  let received;
  ticketsDao.updateById = async (...args) => {
    received = args;
    return { _id: args[0], ...args[1] };
  };
  context.after(() => { ticketsDao.updateById = original; });

  const cancelledAt = new Date("2026-09-26T12:00:00.000Z");
  const result = await ticketRepository.cancelTicket("ticket-id", cancelledAt);

  assert.deepEqual(received, [
    "ticket-id",
    { status: "cancelled", cancelledAt },
  ]);
  assert.equal(result.status, "cancelled");
});

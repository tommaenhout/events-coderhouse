import assert from "node:assert/strict";
import test from "node:test";

import ticketsDao from "../src/dao/tickets.dao.js";
import { Ticket } from "../src/models/ticket.model.js";

const stubModel = (context, stubs) => {
  const originals = {};
  for (const [method, implementation] of Object.entries(stubs)) {
    originals[method] = Ticket[method];
    Ticket[method] = implementation;
  }
  context.after(() => Object.assign(Ticket, originals));
};

const query = (value, calls) => ({
  populate(...args) {
    calls.push(["populate", ...args]);
    return this;
  },
  sort(value) {
    calls.push(["sort", value]);
    return this;
  },
  lean() {
    calls.push(["lean"]);
    return value;
  },
});

test("tickets DAO creates plain tickets and validates ids", async (context) => {
  const persisted = { _id: "ticket-id", status: "confirmed" };
  stubModel(context, {
    create: async (data) => ({ toObject: () => ({ ...persisted, ...data }) }),
  });

  assert.equal(ticketsDao.isValidId("507f1f77bcf86cd799439011"), true);
  assert.equal(ticketsDao.isValidId("invalid"), false);
  assert.deepEqual(await ticketsDao.create({ quantity: 2 }), {
    ...persisted,
    quantity: 2,
  });
});

test("tickets DAO executes lookup and populate queries", async (context) => {
  const calls = [];
  stubModel(context, {
    findOne: (filter) => {
      calls.push(["findOne", filter]);
      return { lean: () => ({ _id: "existing" }) };
    },
    findById: (id) => {
      calls.push(["findById", id]);
      return query({ _id: id }, calls);
    },
    find: (filter) => {
      calls.push(["find", filter]);
      return query([{ _id: "ticket-id" }], calls);
    },
  });

  assert.deepEqual(
    await ticketsDao.findByUserAndEvent("user-id", "event-id", "confirmed"),
    { _id: "existing" },
  );
  assert.deepEqual(await ticketsDao.findById("ticket-id"), { _id: "ticket-id" });
  assert.deepEqual(await ticketsDao.findByUser("user-id"), [{ _id: "ticket-id" }]);
  assert.deepEqual(await ticketsDao.findByEvent("event-id"), [{ _id: "ticket-id" }]);

  assert.deepEqual(calls[0], ["findOne", {
    user: "user-id",
    event: "event-id",
    status: "confirmed",
  }]);
  assert.ok(calls.some((call) => call[0] === "populate" && call[1] === "event"));
  assert.ok(calls.some((call) => call[0] === "populate" && call[1] === "user"));
  assert.equal(calls.filter((call) => call[0] === "sort").length, 2);
});

test("tickets DAO updates tickets and sums confirmed quantities", async (context) => {
  const calls = [];
  stubModel(context, {
    findByIdAndUpdate: (id, data, options) => {
      calls.push(["update", id, data, options]);
      return query({ _id: id, ...data }, calls);
    },
    aggregate: async (pipeline) => {
      calls.push(["aggregate", pipeline]);
      return [{ totalReserved: 4 }];
    },
  });

  const cancelledAt = new Date("2026-09-26T12:00:00.000Z");
  assert.deepEqual(
    await ticketsDao.updateById("ticket-id", { status: "cancelled", cancelledAt }),
    { _id: "ticket-id", status: "cancelled", cancelledAt },
  );
  assert.equal(await ticketsDao.sumReservedByEvent("event-id"), 4);
  assert.deepEqual(calls[0], [
    "update",
    "ticket-id",
    { status: "cancelled", cancelledAt },
    { new: true, runValidators: true },
  ]);
  assert.deepEqual(calls.find((call) => call[0] === "aggregate")[1], [
    { $match: { event: "event-id", status: "confirmed" } },
    { $group: { _id: "$event", totalReserved: { $sum: "$quantity" } } },
  ]);
});

test("tickets DAO returns zero when an event has no confirmed tickets", async (context) => {
  stubModel(context, { aggregate: async () => [] });
  assert.equal(await ticketsDao.sumReservedByEvent("event-id"), 0);
});


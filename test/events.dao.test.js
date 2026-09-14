import assert from "node:assert/strict";
import test from "node:test";

import eventsDao from "../src/dao/events.dao.js";
import { Event } from "../src/models/event.model.js";

const stubModel = (context, stubs) => {
  const originals = {};
  for (const [method, implementation] of Object.entries(stubs)) {
    originals[method] = Event[method];
    Event[method] = implementation;
  }
  context.after(() => Object.assign(Event, originals));
};

test("events DAO executes Mongoose operations", async (context) => {
  const calls = [];
  const query = (value) => ({
    populate() { return this; },
    sort() { return this; },
    skip() { return this; },
    limit() { return this; },
    lean() { return value; },
  });
  stubModel(context, {
    find: () => query(["all"]),
    findById: (id) => query({ id }),
    create: async (data) => ({ toObject: () => ({ id: "new", ...data }) }),
    findByIdAndUpdate: (id, data, options) => {
      calls.push([id, data, options]);
      return query({ id, ...data });
    },
    countDocuments: async () => 1,
  });

  assert.deepEqual(await eventsDao.findAll(), ["all"]);
  assert.deepEqual(await eventsDao.findById("one"), { id: "one" });
  assert.deepEqual(await eventsDao.create({ title: "New" }), {
    id: "new",
    title: "New",
  });
  assert.deepEqual(await eventsDao.updateById("one", { title: "Updated" }), {
    id: "one",
    title: "Updated",
  });
  assert.equal(await eventsDao.count({ status: "draft" }), 1);
  assert.deepEqual(calls, [
    ["one", { title: "Updated" }, { new: true, runValidators: true }],
  ]);
});

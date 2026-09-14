import assert from "node:assert/strict";
import test from "node:test";

import eventsDao from "../src/dao/events.dao.js";
import eventsRepository from "../src/repositories/events.repository.js";

test("events repository delegates operations to the DAO", async (context) => {
  const calls = [];
  const originals = {};
  for (const method of ["findAll", "findById", "create", "updateById", "count"]) {
    originals[method] = eventsDao[method];
    eventsDao[method] = async (...args) => {
      calls.push([method, ...args]);
      return method;
    };
  }
  context.after(() => Object.assign(eventsDao, originals));

  assert.equal(
    await eventsRepository.findAll({ status: "draft" }, { limit: 10 }),
    "findAll",
  );
  assert.equal(await eventsRepository.findById("one"), "findById");
  assert.equal(await eventsRepository.create({ title: "New" }), "create");
  assert.equal(
    await eventsRepository.updateById("one", { title: "Updated" }),
    "updateById",
  );
  assert.equal(await eventsRepository.count({ status: "draft" }), "count");
  assert.deepEqual(calls, [
    ["findAll", { status: "draft" }, { limit: 10 }],
    ["findById", "one"],
    ["create", { title: "New" }],
    ["updateById", "one", { title: "Updated" }],
    ["count", { status: "draft" }],
  ]);
});

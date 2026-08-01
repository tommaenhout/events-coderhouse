import assert from "node:assert/strict";
import test from "node:test";

import { createEventRepository } from "../src/repositories/events.repository.js";

const leanResult = (value, calls, method) => ({
  lean() {
    calls.push([`${method}.lean`]);
    return value;
  },
});

test("event repository delegates CRUD operations to the injected model", async () => {
  const calls = [];
  const EventModel = {
    find() {
      calls.push(["find"]);
      return leanResult(["all"], calls, "find");
    },
    findById(id) {
      calls.push(["findById", id]);
      return leanResult({ id }, calls, "findById");
    },
    async create(data) {
      calls.push(["create", data]);
      return { toObject: () => ({ id: "created", ...data }) };
    },
    findByIdAndUpdate(id, data, options) {
      calls.push(["findByIdAndUpdate", id, data, options]);
      return leanResult({ id, ...data }, calls, "findByIdAndUpdate");
    },
    findByIdAndDelete(id) {
      calls.push(["findByIdAndDelete", id]);
      return leanResult({ id }, calls, "findByIdAndDelete");
    },
  };
  const repository = createEventRepository({ EventModel });

  assert.deepEqual(await repository.findAll(), ["all"]);
  assert.deepEqual(await repository.findById("one"), { id: "one" });
  assert.deepEqual(await repository.create({ title: "New" }), {
    id: "created",
    title: "New",
  });
  assert.deepEqual(await repository.updateById("one", { title: "Updated" }), {
    id: "one",
    title: "Updated",
  });
  assert.deepEqual(await repository.deleteById("one"), { id: "one" });

  assert.deepEqual(calls, [
    ["find"],
    ["find.lean"],
    ["findById", "one"],
    ["findById.lean"],
    ["create", { title: "New" }],
    [
      "findByIdAndUpdate",
      "one",
      { title: "Updated" },
      { new: true, runValidators: true },
    ],
    ["findByIdAndUpdate.lean"],
    ["findByIdAndDelete", "one"],
    ["findByIdAndDelete.lean"],
  ]);
});

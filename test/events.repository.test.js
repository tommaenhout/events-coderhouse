import assert from "node:assert/strict";
import test from "node:test";

import { createEventRepository } from "../src/repositories/events.repository.js";

test("event repository delegates CRUD operations to the injected DAO", async () => {
  const calls = [];
  const eventDao = {
    async findAll() {
      calls.push(["findAll"]);
      return ["all"];
    },
    async findById(id) {
      calls.push(["findById", id]);
      return { id };
    },
    async create(data) {
      calls.push(["create", data]);
      return { id: "created", ...data };
    },
    async updateById(id, data) {
      calls.push(["updateById", id, data]);
      return { id, ...data };
    },
    async deleteById(id) {
      calls.push(["deleteById", id]);
      return { id };
    },
  };
  const repository = createEventRepository({ eventDao });

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
    ["findAll"],
    ["findById", "one"],
    ["create", { title: "New" }],
    ["updateById", "one", { title: "Updated" }],
    ["deleteById", "one"],
  ]);
});

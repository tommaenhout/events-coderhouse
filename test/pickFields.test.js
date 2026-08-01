import assert from "node:assert/strict";
import test from "node:test";

import { pickFields } from "../src/utils/pickFields.js";

test("pickFields returns only own properties included in the allowlist", () => {
  const inherited = { inherited: "ignored" };
  const source = Object.assign(Object.create(inherited), {
    title: "Conference",
    location: "Buenos Aires",
    ignored: "value",
  });

  assert.deepEqual(pickFields(source, ["title", "location", "inherited"]), {
    title: "Conference",
    location: "Buenos Aires",
  });
});

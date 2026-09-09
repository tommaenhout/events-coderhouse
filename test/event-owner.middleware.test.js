import assert from "node:assert/strict";
import test from "node:test";
import mongoose from "mongoose";
import { Event } from "../src/models/event.model.js";
import { authorizeEventOwnerOrAdmin } from "../src/middlewares/authorizeEventOwnerOrAdmin.js";

test("event authorization compares ObjectId ownership and allows admins", async (context) => {
  const owner = new mongoose.Types.ObjectId();
  const event = { organizer: owner };
  context.mock.method(Event, "findById", async () => event);

  for (const [user, allowed] of [
    [{ id: owner.toString(), role: "organizer" }, true],
    [{ id: new mongoose.Types.ObjectId().toString(), role: "organizer" }, false],
    [{ id: new mongoose.Types.ObjectId().toString(), role: "admin" }, true],
  ]) {
    const req = { params: { id: "event" }, user };
    let continued = false;
    let status;
    const res = {
      status(code) { status = code; return this; },
      json() {},
    };
    await authorizeEventOwnerOrAdmin(req, res, () => { continued = true; });
    assert.equal(continued, allowed);
    if (allowed) assert.equal(req.event, event);
    else assert.equal(status, 403);
  }
});

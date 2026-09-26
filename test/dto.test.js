import assert from "node:assert/strict";
import test from "node:test";

import { EventDTO } from "../src/dto/event.dto.js";
import { TicketDTO } from "../src/dto/ticket.dto.js";
import { UserDTO } from "../src/dto/user.dto.js";

test("response DTOs never expose user passwords", () => {
  const user = {
    _id: "user-id",
    first_name: "Ada",
    last_name: "Lovelace",
    email: "ada@example.com",
    role: "organizer",
    password: "hashed-secret",
  };
  const event = {
    _id: "event-id",
    title: "Tech Day",
    organizer: user,
  };
  const ticket = {
    _id: "ticket-id",
    user,
    event,
    status: "confirmed",
    quantity: 1,
    reservationCode: "ABC-123",
  };

  const responses = [new UserDTO(user), new EventDTO(event), new TicketDTO(ticket)];
  for (const response of responses) {
    assert.equal(JSON.stringify(response).includes("password"), false);
    assert.equal(JSON.stringify(response).includes("hashed-secret"), false);
  }
});

test("ticket DTO keeps unpopulated references as ids", () => {
  const reference = { toString: () => "reference-id" };
  const dto = new TicketDTO({
    _id: "ticket-id",
    user: reference,
    event: reference,
    status: "confirmed",
  });

  assert.equal(dto.user, "reference-id");
  assert.equal(dto.event, "reference-id");
});

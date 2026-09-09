import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";

import app from "../src/app.js";
import usersService from "../src/services/users.service.js";
import { generateJWT } from "../src/utils/jwt.js";

const requestUsers = (baseUrl, user) => {
  const headers = user
    ? { cookie: `currentUser=${generateJWT(user)}` }
    : undefined;

  return fetch(`${baseUrl}/api/users`, { headers });
};

test("GET /api/users is restricted to admins", async (context) => {
  const originalGetAllUsers = usersService.getAllUsers;
  usersService.getAllUsers = async () => [
    { _id: "user-id", email: "user@example.com", role: "user" },
  ];
  context.after(() => {
    usersService.getAllUsers = originalGetAllUsers;
  });

  const server = app.listen(0, "127.0.0.1");
  try {
    await once(server, "listening");
    const baseUrl = `http://127.0.0.1:${server.address().port}`;

    const unauthenticated = await requestUsers(baseUrl);
    assert.equal(unauthenticated.status, 401);
    assert.deepEqual(await unauthenticated.json(), {
      status: "error",
      message: "No autenticado",
    });

    const organizer = await requestUsers(baseUrl, {
      id: "organizer-id",
      email: "organizer@example.com",
      role: "organizer",
    });
    assert.equal(organizer.status, 403);
    assert.deepEqual(await organizer.json(), {
      status: "error",
      message: "Acceso denegado",
    });

    const admin = await requestUsers(baseUrl, {
      id: "admin-id",
      email: "admin@example.com",
      role: "admin",
    });
    assert.equal(admin.status, 200);
    assert.deepEqual(await admin.json(), {
      status: "success",
      payload: [
        { _id: "user-id", email: "user@example.com", role: "user" },
      ],
    });
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
      server.closeAllConnections();
    });
  }
});

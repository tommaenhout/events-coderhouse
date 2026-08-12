import assert from "node:assert/strict";
import test from "node:test";

import {
  generateJWT,
  generateRefreshToken,
  verifyJWT,
  verifyRefreshToken,
} from "../src/utils/jwt.js";

test("access and refresh tokens are distinct and can be verified", () => {
  const user = {
    id: "user-id",
    email: "tom@example.com",
    role: "user",
  };
  const accessToken = generateJWT(user);
  const refreshToken = generateRefreshToken(user);

  const accessPayload = verifyJWT(accessToken);
  const refreshPayload = verifyRefreshToken(refreshToken);

  assert.notEqual(accessToken, refreshToken);
  assert.equal(accessPayload.email, "tom@example.com");
  assert.equal(refreshPayload.id, "user-id");
  assert.equal(refreshPayload.email, undefined);
});

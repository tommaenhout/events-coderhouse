import { Router } from "express";

import { register, login, logout, current } from "../controllers/sessions.controller.js";
import { loginWithPassport } from "../middlewares/login.middleware.js";
import { registerWithPassport } from "../middlewares/register.middleware.js";

import passport from "../config/passport.js";

const router = Router();

router.post("/register", registerWithPassport, register);
router.post("/login", loginWithPassport, login);
router.get(
  "/current",
  passport.authenticate("current", { session: false }),
  current,
);
router.post("/logout", logout);

export default router;

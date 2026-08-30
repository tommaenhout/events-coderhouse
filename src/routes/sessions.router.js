import { Router } from "express";
import passport from "passport";

import { register } from "../controllers/sessions.controller.js";
const router = Router();

router.post("/register", passport.authenticate("register", { session: false }), register);

export default router;

import { Router } from "express";

import { register } from "../controllers/sessions.controller.js";
import { registerWithPassport } from "../middlewares/register.middleware.js";

const router = Router();

router.post("/register", registerWithPassport, register);

export default router;

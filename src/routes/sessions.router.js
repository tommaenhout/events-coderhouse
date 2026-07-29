import { Router } from "express";

import { getSessions } from "../controllers/sessions.controller.js";

const sessionsRouter = Router();

sessionsRouter.get("/", getSessions);

export default sessionsRouter;

import { Router } from "express";

import {
  createEvent,
  getEventById,
  getEvents,
  updateEvent,
} from "../controllers/events.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { authorizeEventOwnerOrAdmin } from "../middlewares/authorizeEventOwnerOrAdmin.js";
import { authorizeRoles } from "../middlewares/authorizeRole.js";

const eventsRouter = Router();

eventsRouter.post("/", authMiddleware, authorizeRoles(["admin", "organizer"]), createEvent);
eventsRouter.get("/", getEvents);
eventsRouter.get("/:id", authMiddleware, getEventById);
eventsRouter.put("/:id", authMiddleware, authorizeRoles(["admin", "organizer"]), authorizeEventOwnerOrAdmin, updateEvent);

export default eventsRouter;

import { Router } from "express";

import {
  changeEventStatus,
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
eventsRouter.get("/:id", getEventById);
eventsRouter.put("/:id", authMiddleware, authorizeRoles(["admin", "organizer"]), authorizeEventOwnerOrAdmin, updateEvent);
eventsRouter.patch("/:id/status", authMiddleware, authorizeRoles(["admin", "organizer"]), authorizeEventOwnerOrAdmin, changeEventStatus);

export default eventsRouter;

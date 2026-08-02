import { Router } from "express";

import {
  createEvent,
  deleteEvent,
  getEventById,
  getEvents,
  updateEvent,
} from "../controllers/events.controller.js";

const eventsRouter = Router();

eventsRouter.get("/", getEvents);
eventsRouter.get("/:id", getEventById);
eventsRouter.post("/", createEvent);
eventsRouter.put("/:id", updateEvent);
eventsRouter.delete("/:id", deleteEvent);

export default eventsRouter;

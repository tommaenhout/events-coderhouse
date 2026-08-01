import { Router } from "express";

export const createEventsRouter = ({ eventsController }) => {
  const eventsRouter = Router();

  eventsRouter.get("/", eventsController.getEvents);
  eventsRouter.get("/:id", eventsController.getEventById);
  eventsRouter.post("/", eventsController.createEvent);
  eventsRouter.put("/:id", eventsController.updateEvent);
  eventsRouter.delete("/:id", eventsController.deleteEvent);

  return eventsRouter;
};

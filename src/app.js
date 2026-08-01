import express from "express";

import { getHealth } from "./controllers/health.controller.js";
import { createErrorHandler } from "./middlewares/errorHandler.js";

export const createApp = ({
  eventsRouter,
  sessionsRouter,
  usersRouter,
  logger = console,
}) => {
  const app = express();

  app.use(express.json());
  app.get("/api/health", getHealth);
  app.use("/api/events", eventsRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/sessions", sessionsRouter);

  app.use(createErrorHandler({ logger }));

  return app;
};

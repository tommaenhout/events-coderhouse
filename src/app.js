import express from "express";

import { getHealth } from "./controllers/health.controller.js";

export const createApp = ({ eventsRouter, sessionsRouter, logger = console }) => {
  const app = express();

  app.use(express.json());
  app.get("/api/health", getHealth);
  app.use("/api/events", eventsRouter);
  app.use("/api/sessions", sessionsRouter);

  app.use((error, _request, response, _next) => {
    const isBadRequest =
      error.name === "CastError" ||
      error.name === "ValidationError" ||
      (error instanceof SyntaxError && error.status === 400);

    if (isBadRequest) {
      response.status(400).json({
        status: "error",
        message: "Solicitud inválida",
      });
      return;
    }

    logger.error(error);
    response.status(500).json({
      status: "error",
      message: "Error interno del servidor",
    });
  });

  return app;
};

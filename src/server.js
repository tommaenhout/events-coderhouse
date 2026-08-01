import mongoose from "mongoose";

import { createApp } from "./app.js";
import { createDatabase } from "./config/database.js";
import { env } from "./config/env.js";
import { createEventsController } from "./controllers/events.controller.js";
import { createEventDao } from "./dao/events.dao.js";
import { Event } from "./models/Event.js";
import { createEventRepository } from "./repositories/events.repository.js";
import { createEventsRouter } from "./routes/events.router.js";
import sessionsRouter from "./routes/sessions.router.js";
import { createEventsService } from "./services/events.service.js";
import { startApplication } from "./startApplication.js";

const database = createDatabase({
  client: mongoose,
  mongoUrl: env.mongoUrl,
  dbName: env.mongoDbName,
});

const eventDao = createEventDao({ EventModel: Event });
const eventRepository = createEventRepository({ eventDao });
const eventService = createEventsService({ eventRepository });
const eventsController = createEventsController({ eventService });
const eventsRouter = createEventsRouter({ eventsController });
const app = createApp({ eventsRouter, sessionsRouter });

const startServer = async () => {
  try {
    const application = await startApplication({
      app,
      database,
      port: env.port,
    });

    const shutdown = async (signal) => {
      console.log(`\n${signal} recibido. Cerrando el servidor...`);
      await application.stop();
      process.exit(0);
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("No se pudo iniciar la aplicación:", error.message);
    process.exit(1);
  }
};

startServer();

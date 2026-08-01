import mongoose from "mongoose";

import { createApp } from "./app.js";
import { createDatabase } from "./config/database.js";
import { env } from "./config/env.js";
import { createEventsController } from "./controllers/events.controller.js";
import { createSessionsController } from "./controllers/sessions.controller.js";
import { createUsersController } from "./controllers/users.controller.js";
import { createEventDao } from "./dao/events.dao.js";
import { createUserDao } from "./dao/users.dao.js";
import { Event } from "./models/Event.js";
import { User } from "./models/User.js";
import { createEventRepository } from "./repositories/events.repository.js";
import { createUserRepository } from "./repositories/users.repository.js";
import { createEventsRouter } from "./routes/events.router.js";
import { createSessionsRouter } from "./routes/sessions.router.js";
import { createUsersRouter } from "./routes/users.router.js";
import { createEventsService } from "./services/events.service.js";
import { createSessionsService } from "./services/sessions.service.js";
import { createUsersService } from "./services/users.service.js";
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

const sessionsService = createSessionsService();
const sessionsController = createSessionsController({ sessionsService });
const sessionsRouter = createSessionsRouter({ sessionsController });

const userDao = createUserDao({ UserModel: User });
const userRepository = createUserRepository({ userDao });
const usersService = createUsersService({ userRepository });
const usersController = createUsersController({ usersService });
const usersRouter = createUsersRouter({ usersController });

const app = createApp({ eventsRouter, sessionsRouter, usersRouter });

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

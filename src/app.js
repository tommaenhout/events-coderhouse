import express from "express";

import { getHealth } from "./controllers/health.controller.js";
import { createErrorHandler } from "./middlewares/errorHandler.js";
import eventsRouter from "./routes/events.router.js";
import sessionsRouter from "./routes/sessions.router.js";
import usersRouter from "./routes/users.router.js";

const app = express();

app.use(express.json());
app.get("/api/health", getHealth);
app.use("/api/events", eventsRouter);
app.use("/api/users", usersRouter);
app.use("/api/sessions", sessionsRouter);
app.use(createErrorHandler());

export default app;

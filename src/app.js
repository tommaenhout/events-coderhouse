import express from "express";

import { getHealth } from "./controllers/health.controller.js";
import { createErrorHandler } from "./middlewares/errorHandler.js";
import { notFoundHandler } from "./middlewares/notFoundHandler.js";
import eventsRouter from "./routes/events.router.js";
import sessionsRouter from "./routes/sessions.router.js";
import usersRouter from "./routes/users.router.js";
import cookieParser from "cookie-parser";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.get("/api/health", getHealth);
app.use("/api/events", eventsRouter);
app.use("/api/users", usersRouter);
app.use("/api/sessions", sessionsRouter);
app.use(notFoundHandler);
app.use(createErrorHandler());

export default app;

import express from "express";

import { getHealth } from "./controllers/health.controller.js";
import eventsRouter from "./routes/events.router.js";
import sessionsRouter from "./routes/sessions.router.js";

const app = express();

app.use(express.json());
app.get("/api/health", getHealth);
app.use("/api/events", eventsRouter);
app.use("/api/sessions", sessionsRouter);

export default app;

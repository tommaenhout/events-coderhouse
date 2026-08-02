import mongoose from "mongoose";

import app from "./app.js";
import { createDatabase } from "./config/database.js";
import { env } from "./config/env.js";
import { startApplication } from "./startApplication.js";

const database = createDatabase({
  client: mongoose,
  mongoUrl: env.mongoUrl,
  dbName: env.mongoDbName,
});

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

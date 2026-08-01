export const startApplication = async ({ app, database, port, logger = console }) => {
  await database.connect();

  const server = app.listen(port, () => {
    logger.log(`Servidor activo en http://localhost:${port}`);
  });

  let stopPromise;

  const stop = () => {
    if (stopPromise) {
      return stopPromise;
    }

    stopPromise = new Promise((resolve, reject) => {
      const finishShutdown = async (serverError) => {
        try {
          await database.disconnect();

          if (serverError && serverError.code !== "ERR_SERVER_NOT_RUNNING") {
            reject(serverError);
            return;
          }

          resolve();
        } catch (databaseError) {
          reject(databaseError);
        }
      };

      if (server.listening) {
        server.close(finishShutdown);
      } else {
        finishShutdown();
      }
    });

    return stopPromise;
  };

  return { server, stop };
};

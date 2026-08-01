export const startApplication = async ({ app, database, port, logger = console }) => {
  await database.connect();

  const server = app.listen(port, () => {
    logger.log(`Servidor activo en http://localhost:${port}`);
  });

  const stop = () =>
    new Promise((resolve, reject) => {
      server.close(async (serverError) => {
        try {
          await database.disconnect();

          if (serverError) {
            reject(serverError);
            return;
          }

          resolve();
        } catch (databaseError) {
          reject(databaseError);
        }
      });
    });

  return { server, stop };
};

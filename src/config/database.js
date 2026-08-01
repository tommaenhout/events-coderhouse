export const createDatabase = ({ client, mongoUrl, dbName, logger = console }) => ({
  async connect() {
    await client.connect(mongoUrl, {
      dbName,
      serverSelectionTimeoutMS: 10_000,
    });

    logger.log(`MongoDB conectado a la base de datos "${dbName}"`);
  },

  disconnect() {
    return client.disconnect();
  },
});

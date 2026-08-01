export const createSessionsController = ({ sessionsService }) => ({
  async getSessions(_request, response, next) {
    try {
      const sessions = await sessionsService.getSessions();
      return response.status(200).json({
        status: "success",
        payload: sessions,
      });
    } catch (error) {
      return next(error);
    }
  },
});

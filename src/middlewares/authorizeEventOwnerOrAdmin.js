import eventsService from "../services/events.service.js";

export const authorizeEventOwnerOrAdmin = async (req, res, next) => {
  try {
    req.event = await eventsService.authorizeManagement(req.params.id, req.user);
    return next();
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        status: "error",
        message: error.message,
      });
    }
    return next(error);
  }
};

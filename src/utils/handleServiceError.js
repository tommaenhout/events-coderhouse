import {
  EventNotFoundError,
  EventValidationError,
} from "../services/events.service.js";

export const handleServiceError = (error, res, next) => {
  if (error instanceof EventValidationError) {
    return res.status(400).json({ status: "error", message: error.message });
  }

  if (error instanceof EventNotFoundError) {
    return res.status(404).json({ status: "error", message: error.message });
  }

  return next(error);
};

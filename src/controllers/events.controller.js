import eventsService, {
  EventNotFoundError,
  EventValidationError,
} from "../services/events.service.js";

const handleServiceError = (error, res, next) => {
  if (error instanceof EventValidationError) {
    return res.status(400).json({ status: "error", message: error.message });
  }

  if (error instanceof EventNotFoundError) {
    return res.status(404).json({ status: "error", message: error.message });
  }

  return next(error);
};

export const getEvents = async (_req, res, next) => {
  try {
    const events = await eventsService.getEvents();
    return res.status(200).json({ status: "success", payload: events });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const getEventById = async (req, res, next) => {
  try {
    const event = await eventsService.getEventById(req.params.id);
    return res.status(200).json({ status: "success", payload: event });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const createEvent = async (req, res, next) => {
  try {
    const event = await eventsService.createEvent(req.body);
    return res.status(201).json({ status: "success", payload: event });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const updateEvent = async (req, res, next) => {
  try {
    const event = await eventsService.updateEvent(req.params.id, req.body);
    return res.status(200).json({ status: "success", payload: event });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const deleteEvent = async (req, res, next) => {
  try {
    const event = await eventsService.deleteEvent(req.params.id);
    return res.status(200).json({ status: "success", payload: event });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

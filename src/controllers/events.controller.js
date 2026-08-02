import eventsService, {
  EventNotFoundError,
  EventValidationError,
} from "../services/events.service.js";

const handleServiceError = (error, response, next) => {
  if (error instanceof EventValidationError) {
    return response.status(400).json({ status: "error", message: error.message });
  }

  if (error instanceof EventNotFoundError) {
    return response.status(404).json({ status: "error", message: error.message });
  }

  return next(error);
};

export const getEvents = async (_request, response, next) => {
  try {
    const events = await eventsService.getEvents();
    return response.status(200).json({ status: "success", payload: events });
  } catch (error) {
    return handleServiceError(error, response, next);
  }
};

export const getEventById = async (request, response, next) => {
  try {
    const event = await eventsService.getEventById(request.params.id);
    return response.status(200).json({ status: "success", payload: event });
  } catch (error) {
    return handleServiceError(error, response, next);
  }
};

export const createEvent = async (request, response, next) => {
  try {
    const event = await eventsService.createEvent(request.body);
    return response.status(201).json({ status: "success", payload: event });
  } catch (error) {
    return handleServiceError(error, response, next);
  }
};

export const updateEvent = async (request, response, next) => {
  try {
    const event = await eventsService.updateEvent(request.params.id, request.body);
    return response.status(200).json({ status: "success", payload: event });
  } catch (error) {
    return handleServiceError(error, response, next);
  }
};

export const deleteEvent = async (request, response, next) => {
  try {
    const event = await eventsService.deleteEvent(request.params.id);
    return response.status(200).json({ status: "success", payload: event });
  } catch (error) {
    return handleServiceError(error, response, next);
  }
};

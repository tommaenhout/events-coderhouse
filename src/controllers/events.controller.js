import {
  EventNotFoundError,
  EventValidationError,
} from "../services/events.service.js";

const handleServiceError = (error, response, next) => {
  if (error instanceof EventValidationError) {
    return response.status(400).json({
      status: "error",
      message: error.message,
    });
  }

  if (error instanceof EventNotFoundError) {
    return response.status(404).json({
      status: "error",
      message: error.message,
    });
  }

  return next(error);
};

export const createEventsController = ({ eventService }) => ({
  async getEvents(_request, response, next) {
    try {
      const events = await eventService.getEvents();
      return response.status(200).json({ status: "success", payload: events });
    } catch (error) {
      return handleServiceError(error, response, next);
    }
  },

  async getEventById(request, response, next) {
    try {
      const event = await eventService.getEventById(request.params.id);
      return response.status(200).json({ status: "success", payload: event });
    } catch (error) {
      return handleServiceError(error, response, next);
    }
  },

  async createEvent(request, response, next) {
    try {
      const event = await eventService.createEvent(request.body);
      return response.status(201).json({ status: "success", payload: event });
    } catch (error) {
      return handleServiceError(error, response, next);
    }
  },

  async updateEvent(request, response, next) {
    try {
      const event = await eventService.updateEvent(
        request.params.id,
        request.body,
      );
      return response.status(200).json({ status: "success", payload: event });
    } catch (error) {
      return handleServiceError(error, response, next);
    }
  },

  async deleteEvent(request, response, next) {
    try {
      const event = await eventService.deleteEvent(request.params.id);
      return response.status(200).json({ status: "success", payload: event });
    } catch (error) {
      return handleServiceError(error, response, next);
    }
  },
});

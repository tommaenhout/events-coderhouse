import eventsService from "../services/events.service.js";
import { EventDTO } from "../dto/event.dto.js";
import { handleServiceError } from "../utils/handleServiceError.js";

export const getEvents = async (req, res, next) => {
  try {
    const events = await eventsService.getEvents(req.query);
    const payload = Array.isArray(events)
      ? events
      : { ...events, data: events.data.map((event) => new EventDTO(event)) };
    return res.status(200).json({ status: "success", payload });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const getEventById = async (req, res, next) => {
  try {
    const event = await eventsService.getEventById(req.params.id);
    return res.status(200).json({ status: "success", payload: new EventDTO(event) });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const createEvent = async (req, res, next) => {
  try {
    const event = await eventsService.createEvent(req.body, req.user.id);
    return res.status(201).json({ status: "success", payload: new EventDTO(event) });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const updateEvent = async (req, res, next) => {
  try {
    const event = await eventsService.updateEvent(req.params.id, req.body);
    return res.status(200).json({ status: "success", payload: new EventDTO(event) });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const changeEventStatus = async (req, res, next) => {
  try {
    const event = await eventsService.changeStatus(req.params.id, req.body?.status);
    return res.status(200).json({ status: "success", payload: new EventDTO(event) });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

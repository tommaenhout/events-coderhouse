import { pickFields } from "../utils/pickFields.js";

const eventFields = ["title", "description", "date", "location", "organizer"];
const stringFields = ["title", "description", "location", "organizer"];

export class EventValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "EventValidationError";
  }
}

export class EventNotFoundError extends Error {
  constructor() {
    super("Evento no encontrado");
    this.name = "EventNotFoundError";
  }
}

const validateEventData = (body, { creating = false } = {}) => {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new EventValidationError(
      "El cuerpo de la solicitud debe ser un objeto JSON",
    );
  }

  const data = pickFields(body, eventFields);

  if (Object.keys(data).length === 0) {
    throw new EventValidationError(
      "Debe enviar al menos un campo válido del evento",
    );
  }

  if (creating && (!Object.hasOwn(data, "title") || !Object.hasOwn(data, "date"))) {
    throw new EventValidationError("Los campos title y date son obligatorios");
  }

  for (const field of stringFields) {
    if (Object.hasOwn(data, field) && typeof data[field] !== "string") {
      throw new EventValidationError(`El campo ${field} debe ser un texto`);
    }
  }

  if (Object.hasOwn(data, "title") && data.title.trim().length === 0) {
    throw new EventValidationError("El campo title no puede estar vacío");
  }

  if (
    Object.hasOwn(data, "date") &&
    (typeof data.date !== "string" ||
      data.date.trim().length === 0 ||
      Number.isNaN(Date.parse(data.date)))
  ) {
    throw new EventValidationError(
      "El campo date debe contener una fecha válida",
    );
  }

  return data;
};

const requireEvent = (event) => {
  if (!event) {
    throw new EventNotFoundError();
  }

  return event;
};

export const createEventsService = ({ eventRepository }) => ({
  getEvents() {
    return eventRepository.findAll();
  },

  async getEventById(id) {
    return requireEvent(await eventRepository.findById(id));
  },

  createEvent(eventData) {
    return eventRepository.create(
      validateEventData(eventData, { creating: true }),
    );
  },

  async updateEvent(id, eventData) {
    const event = await eventRepository.updateById(
      id,
      validateEventData(eventData),
    );
    return requireEvent(event);
  },

  async deleteEvent(id) {
    return requireEvent(await eventRepository.deleteById(id));
  },
});

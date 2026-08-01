const eventFields = ["title", "description", "date", "location", "organizer"];
const stringFields = ["title", "description", "location", "organizer"];

const getEventData = (body) =>
  Object.fromEntries(
    eventFields
      .filter((field) => Object.hasOwn(body, field))
      .map((field) => [field, body[field]]),
  );

const validateEventData = (body, { creating = false } = {}) => {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "El cuerpo de la solicitud debe ser un objeto JSON" };
  }

  const data = getEventData(body);

  if (Object.keys(data).length === 0) {
    return { error: "Debe enviar al menos un campo válido del evento" };
  }

  if (creating && (!Object.hasOwn(data, "title") || !Object.hasOwn(data, "date"))) {
    return { error: "Los campos title y date son obligatorios" };
  }

  for (const field of stringFields) {
    if (Object.hasOwn(data, field) && typeof data[field] !== "string") {
      return { error: `El campo ${field} debe ser un texto` };
    }
  }

  if (Object.hasOwn(data, "title") && data.title.trim().length === 0) {
    return { error: "El campo title no puede estar vacío" };
  }

  if (
    Object.hasOwn(data, "date") &&
    (typeof data.date !== "string" ||
      data.date.trim().length === 0 ||
      Number.isNaN(Date.parse(data.date)))
  ) {
    return { error: "El campo date debe contener una fecha válida" };
  }

  return { data };
};

const sendNotFound = (response) =>
  response.status(404).json({
    status: "error",
    message: "Evento no encontrado",
  });

const sendValidationError = (response, message) =>
  response.status(400).json({ status: "error", message });

export const createEventsController = ({ eventRepository }) => ({
  async getEvents(_request, response, next) {
    try {
      const events = await eventRepository.findAll();
      response.status(200).json({ status: "success", payload: events });
    } catch (error) {
      next(error);
    }
  },

  async getEventById(request, response, next) {
    try {
      const event = await eventRepository.findById(request.params.id);

      if (!event) {
        return sendNotFound(response);
      }

      return response.status(200).json({ status: "success", payload: event });
    } catch (error) {
      return next(error);
    }
  },

  async createEvent(request, response, next) {
    const validation = validateEventData(request.body, { creating: true });

    if (validation.error) {
      return sendValidationError(response, validation.error);
    }

    try {
      const event = await eventRepository.create(validation.data);
      return response.status(201).json({ status: "success", payload: event });
    } catch (error) {
      return next(error);
    }
  },

  async updateEvent(request, response, next) {
    const validation = validateEventData(request.body);

    if (validation.error) {
      return sendValidationError(response, validation.error);
    }

    try {
      const event = await eventRepository.updateById(
        request.params.id,
        validation.data,
      );

      if (!event) {
        return sendNotFound(response);
      }

      return response.status(200).json({ status: "success", payload: event });
    } catch (error) {
      return next(error);
    }
  },

  async deleteEvent(request, response, next) {
    try {
      const event = await eventRepository.deleteById(request.params.id);

      if (!event) {
        return sendNotFound(response);
      }

      return response.status(200).json({ status: "success", payload: event });
    } catch (error) {
      return next(error);
    }
  },
});

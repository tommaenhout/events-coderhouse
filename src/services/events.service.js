import eventsRepository from "../repositories/events.repository.js";
import { pickFields } from "../utils/pickFields.js";

const VALID_STATUSES = ["draft", "published", "cancelled", "finished"];
const EVENT_FIELDS = [
  "title", "description", "category", "date", "location",
  "capacity", "price", "status",
];
const UPDATE_FIELDS = EVENT_FIELDS.filter((field) => field !== "status");
const STRING_FIELDS = ["title", "description", "category", "location"];
const ALLOWED_SORT_FIELDS = ["date", "price", "title", "category", "location"];

export class EventValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "EventValidationError";
    this.statusCode = 400;
  }
}

export class EventNotFoundError extends Error {
  constructor() {
    super("Evento no encontrado");
    this.name = "EventNotFoundError";
    this.statusCode = 404;
  }
}

export class EventForbiddenError extends Error {
  constructor() {
    super("Acceso denegado");
    this.name = "EventForbiddenError";
    this.statusCode = 403;
  }
}

const validateObjectId = (id) => {
  if (!eventsRepository.isValidId(id)) {
    throw new EventValidationError("ID de evento inválido");
  }
};

const validateCapacityAndPrice = (data) => {
  if (data.capacity !== undefined) {
    const capacity = Number(data.capacity);
    if (!Number.isFinite(capacity) || capacity <= 0) {
      throw new EventValidationError("La capacidad debe ser mayor que 0");
    }
  }
  if (data.price !== undefined) {
    const price = Number(data.price);
    if (!Number.isFinite(price) || price < 0) {
      throw new EventValidationError("El precio no puede ser negativo");
    }
  }
};

const validateStatus = (status) => {
  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    throw new EventValidationError(
      `Status inválido. Valores permitidos: ${VALID_STATUSES.join(", ")}`,
    );
  }
};

const validateEventDate = (date, invalidMessage) => {
  const eventDate = new Date(date);
  if (Number.isNaN(eventDate.getTime())) {
    throw new EventValidationError(invalidMessage);
  }
  if (eventDate <= new Date()) {
    throw new EventValidationError("La fecha del evento no puede estar en el pasado");
  }
  return eventDate;
};

const validateEventData = (body, { creating = false } = {}) => {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new EventValidationError("El cuerpo de la solicitud debe ser un objeto JSON");
  }

  const data = pickFields(body, creating ? EVENT_FIELDS : UPDATE_FIELDS);
  if (Object.keys(data).length === 0) {
    throw new EventValidationError(
      creating
        ? "Debe enviar al menos un campo válido del evento"
        : "No hay campos válidos para actualizar",
    );
  }

  if (creating) {
    const requiredFields = [
      "title", "description", "category", "date", "location", "capacity", "price",
    ];
    if (requiredFields.some((field) => !Object.hasOwn(data, field) || data[field] == null)) {
      throw new EventValidationError(
        "title, description, category, date, location, capacity y price son obligatorios",
      );
    }
  }

  for (const field of STRING_FIELDS) {
    if (Object.hasOwn(data, field)) {
      if (typeof data[field] !== "string" || data[field].trim().length === 0) {
        throw new EventValidationError(`El campo ${field} no puede estar vacío`);
      }
      data[field] = data[field].trim();
    }
  }

  if (Object.hasOwn(data, "date")) {
    data.date = validateEventDate(
      data.date,
      creating ? "La fecha del evento no es válida" : "La fecha no es válida",
    );
  }

  validateCapacityAndPrice(data);
  validateStatus(data.status);
  return data;
};

const requireEvent = (event) => {
  if (!event) throw new EventNotFoundError();
  return event;
};

const parseFilterDate = (date, field) => {
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new EventValidationError(`${field} no es una fecha válida`);
  }
  return parsedDate;
};

class EventsService {
  async authorizeManagement(id, user) {
    validateObjectId(id);
    const event = requireEvent(await eventsRepository.findById(id));
    const organizerId = event.organizer?._id ?? event.organizer;
    const isOwner = organizerId?.toString() === user.id;
    if (user.role !== "admin" && !isOwner) {
      throw new EventForbiddenError();
    }
    return event;
  }

  async getEvents(query = {}) {
    const {
      status, category, location, dateFrom, dateTo,
      page = 1, limit = 10, sort = "date",
    } = query;

    validateStatus(status);
    const currentPage = Math.max(Number(page) || 1, 1);
    const currentLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
    const filter = {};

    if (status) filter.status = status;
    if (category) filter.category = { $regex: category, $options: "i" };
    if (location) filter.location = { $regex: location, $options: "i" };
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = parseFilterDate(dateFrom, "dateFrom");
      if (dateTo) filter.date.$lte = parseFilterDate(dateTo, "dateTo");
    }

    const sortValue = typeof sort === "string" ? sort : "date";
    const sortField = sortValue.startsWith("-") ? sortValue.slice(1) : sortValue;
    if (!ALLOWED_SORT_FIELDS.includes(sortField)) {
      throw new EventValidationError(
        `Campo de ordenamiento inválido. Permitidos: ${ALLOWED_SORT_FIELDS.join(", ")}`,
      );
    }

    const skip = (currentPage - 1) * currentLimit;
    const [data, total] = await Promise.all([
      eventsRepository.findAll(filter, {
        skip,
        limit: currentLimit,
        sort: { [sortField]: sortValue.startsWith("-") ? -1 : 1 },
      }),
      eventsRepository.count(filter),
    ]);

    return {
      data,
      page: currentPage,
      limit: currentLimit,
      total,
      totalPages: Math.ceil(total / currentLimit),
    };
  }

  async getEventById(id) {
    validateObjectId(id);
    return requireEvent(await eventsRepository.findById(id));
  }

  createEvent(eventData, userId) {
    const data = validateEventData(eventData, { creating: true });
    return eventsRepository.create({
      ...data,
      status: data.status ?? "draft",
      organizer: userId,
    });
  }

  async updateEvent(id, eventData) {
    const event = await this.getEventById(id);
    if (event.status === "cancelled") {
      throw new EventValidationError("Un evento cancelado no puede modificarse");
    }
    return requireEvent(
      await eventsRepository.updateById(id, validateEventData(eventData)),
    );
  }

  async changeStatus(id, status) {
    const event = await this.getEventById(id);

    if (status === undefined || status === null || status === "") {
      throw new EventValidationError("El campo 'status' es obligatorio");
    }
    validateStatus(status);

    if (event.status === "cancelled") {
      throw new EventValidationError("Un evento cancelado no puede cambiar de estado");
    }
    if (status === "published" && event.status === "finished") {
      throw new EventValidationError("No se puede publicar un evento finalizado");
    }
    if (event.status === status) {
      throw new EventValidationError(`El evento ya tiene status "${status}"`);
    }

    return requireEvent(await eventsRepository.updateById(id, { status }));
  }
}

export default new EventsService();

import { toId, toPlainObject } from "./dto.utils.js";

const mapOrganizer = (organizer) => {
  if (!organizer || typeof organizer !== "object") return toId(organizer);
  const data = toPlainObject(organizer);
  const isPopulated = data.first_name !== undefined || data.last_name !== undefined || data.role !== undefined;
  if (!isPopulated) return toId(organizer);
  return {
    _id: toId(data._id ?? data.id),
    first_name: data.first_name,
    last_name: data.last_name,
    role: data.role,
  };
};

export class EventDTO {
  constructor(event) {
    const data = toPlainObject(event);
    if (data._id !== undefined) this._id = toId(data._id);
    else if (data.id !== undefined) this.id = toId(data.id);
    this.title = data.title;
    this.description = data.description;
    this.category = data.category;
    this.date = data.date;
    this.location = data.location;
    this.capacity = data.capacity;
    this.reserved = data.reserved;
    this.price = data.price;
    this.status = data.status;
    this.organizer = mapOrganizer(data.organizer);
    if (data.createdAt !== undefined) this.createdAt = data.createdAt;
    if (data.updatedAt !== undefined) this.updatedAt = data.updatedAt;
  }
}

export const eventToDTO = (event) => new EventDTO(event);

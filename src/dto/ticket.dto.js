import { EventDTO } from "./event.dto.js";
import { toId, toPlainObject } from "./dto.utils.js";

const mapUser = (user) => {
  if (!user || typeof user !== "object") return toId(user);
  const data = toPlainObject(user);
  const isPopulated = data.first_name !== undefined || data.last_name !== undefined || data.email !== undefined;
  if (!isPopulated) return toId(user);
  return {
    _id: toId(data._id ?? data.id),
    first_name: data.first_name,
    last_name: data.last_name,
    email: data.email,
  };
};

const mapEvent = (event) => {
  if (!event || typeof event !== "object") return toId(event);
  const data = toPlainObject(event);
  if (data.title === undefined) return toId(event);
  return new EventDTO(event);
};

export class TicketDTO {
  constructor(ticket) {
    const data = toPlainObject(ticket);
    this._id = toId(data._id ?? data.id);
    this.user = mapUser(data.user);
    this.event = mapEvent(data.event);
    this.quantity = data.quantity;
    this.status = data.status;
    this.reservationCode = data.reservationCode;
    this.cancelledAt = data.cancelledAt;
    if (data.createdAt !== undefined) this.createdAt = data.createdAt;
    if (data.updatedAt !== undefined) this.updatedAt = data.updatedAt;
  }
}

export class EnrollmentDTO {
  constructor(ticket) {
    const data = toPlainObject(ticket);
    this.id = toId(data._id ?? data.id);
    this.event = toId(data.event?._id ?? data.event);
    this.quantity = data.quantity;
    this.status = data.status;
    this.reservationCode = data.reservationCode;
  }
}

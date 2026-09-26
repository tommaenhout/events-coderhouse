import { toId, toPlainObject } from "./dto.utils.js";

export class UserDTO {
  constructor(user) {
    const data = toPlainObject(user);
    this.id = toId(data._id ?? data.id);
    this.email = data.email;
    this.role = data.role;
  }
}

export class PublicUserDTO {
  constructor(user) {
    const data = toPlainObject(user);
    this._id = toId(data._id ?? data.id);
    this.first_name = data.first_name;
    this.last_name = data.last_name;
    this.email = data.email;
    this.role = data.role;
    if (data.createdAt !== undefined) this.createdAt = data.createdAt;
    if (data.updatedAt !== undefined) this.updatedAt = data.updatedAt;
  }
}

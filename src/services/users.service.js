import {
  UserEmailConflictError,
  UserNotFoundError,
  UserValidationError,
} from "../errors/users.errors.js";
import { pickFields } from "../utils/pickFields.js";

const userFields = ["name", "email", "role"];
const allowedRoles = new Set(["user", "admin"]);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateUserData = (body, { creating = false } = {}) => {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new UserValidationError(
      "El cuerpo de la solicitud debe ser un objeto JSON",
    );
  }

  const data = pickFields(body, userFields);

  if (Object.keys(data).length === 0) {
    throw new UserValidationError(
      "Debe enviar al menos un campo válido del usuario",
    );
  }

  if (creating && (!Object.hasOwn(data, "name") || !Object.hasOwn(data, "email"))) {
    throw new UserValidationError("Los campos name y email son obligatorios");
  }

  if (Object.hasOwn(data, "name")) {
    if (typeof data.name !== "string" || data.name.trim().length === 0) {
      throw new UserValidationError("El campo name no puede estar vacío");
    }
    data.name = data.name.trim();
  }

  if (Object.hasOwn(data, "email")) {
    if (typeof data.email !== "string" || !emailPattern.test(data.email.trim())) {
      throw new UserValidationError("El campo email debe ser válido");
    }
    data.email = data.email.trim().toLowerCase();
  }

  if (Object.hasOwn(data, "role") && !allowedRoles.has(data.role)) {
    throw new UserValidationError("El campo role debe ser user o admin");
  }

  return data;
};

const requireUser = (user) => {
  if (!user) {
    throw new UserNotFoundError();
  }
  return user;
};

export const createUsersService = ({ userRepository }) => ({
  getUsers() {
    return userRepository.findAll();
  },

  async getUserById(id) {
    return requireUser(await userRepository.findById(id));
  },

  async createUser(userData) {
    const data = validateUserData(userData, { creating: true });

    if (await userRepository.findByEmail(data.email)) {
      throw new UserEmailConflictError();
    }

    return userRepository.create(data);
  },

  async updateUser(id, userData) {
    const data = validateUserData(userData);

    if (data.email) {
      const existingUser = await userRepository.findByEmail(data.email);
      if (existingUser && String(existingUser._id) !== id) {
        throw new UserEmailConflictError();
      }
    }

    return requireUser(await userRepository.updateById(id, data));
  },

  async deleteUser(id) {
    return requireUser(await userRepository.deleteById(id));
  },
});

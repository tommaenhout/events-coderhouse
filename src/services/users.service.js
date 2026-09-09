import {
  UserEmailConflictError,
  UserValidationError,
} from "../errors/users.errors.js";
import usersRepository from "../repositories/users.repository.js";
import { createHash } from "../utils/hash.js";
import { pickFields } from "../utils/pickFields.js";

const userFields = ["first_name", "last_name", "email", "password", "role"];
const allowedRoles = new Set(["user", "organizer", "admin"]);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const minimumPasswordLength = 8;

const validateUserData = (body) => {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new UserValidationError("El cuerpo debe ser un objeto JSON");
  }

  const data = pickFields(body, userFields);
  if (Object.keys(data).length === 0) {
    throw new UserValidationError("Debe enviar al menos un campo válido");
  }

  const requiredFields = ["first_name", "last_name", "email", "password"];
  if (requiredFields.some((field) => !data[field])) {
    throw new UserValidationError(
      "first_name, last_name, email y password son obligatorios",
    );
  }

  for (const field of ["first_name", "last_name"]) {
    if (Object.hasOwn(data, field)) {
      if (typeof data[field] !== "string" || data[field].trim().length === 0) {
        throw new UserValidationError(`${field} no puede estar vacío`);
      }
      data[field] = data[field].trim();
    }
  }

  if (Object.hasOwn(data, "email")) {
    if (typeof data.email !== "string" || !emailPattern.test(data.email.trim())) {
      throw new UserValidationError("El email debe ser válido");
    }
    data.email = data.email.trim().toLowerCase();
  }

  if (Object.hasOwn(data, "password")) {
    if (typeof data.password !== "string" || data.password.length < minimumPasswordLength) {
      throw new UserValidationError(
        `La contraseña debe tener al menos ${minimumPasswordLength} caracteres`,
      );
    }
  }

  if (Object.hasOwn(data, "role") && !allowedRoles.has(data.role)) {
    throw new UserValidationError("El rol debe ser user, organizer o admin");
  }

  return data;
};

const withoutPassword = (user) => {
  const { password: _password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

class UsersService {
  async registerUser(userData) {
    const data = validateUserData(userData);

    const existingUser = await usersRepository.findByEmail(data.email);

    if (existingUser) {
      throw new UserEmailConflictError();
    }

    data.password = await createHash(data.password);

    const newUser = await usersRepository.create({
      ...data,
      provider: "local",
      providerId: null,
    });

    return withoutPassword(newUser);
  }
  async getAllUsers() {
    const users = await usersRepository.findAll();
    return users.map(withoutPassword);
  }
}

export default new UsersService();

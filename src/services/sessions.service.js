import usersRepository from "../repositories/users.repository.js";
import { SessionValidationError } from "../errors/sessions.errors.js";
import { UserEmailConflictError } from "../errors/users.errors.js";
import { createHash } from "../utils/hash.js";

const MIN_PASSWORD_LENGTH = 8;

class SessionsService {
  async register(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new SessionValidationError(
        "El cuerpo de la solicitud debe ser un objeto JSON",
      );
    }

    const { first_name, last_name, email, password } = data;

    if (!first_name || !last_name || !email || !password) {
      throw new SessionValidationError(
        "Los campos first_name, last_name, email y password son obligatorios",
      );
    }

    if (
      typeof first_name !== "string" ||
      typeof last_name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      throw new SessionValidationError(
        "Los campos de registro deben contener texto",
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      throw new SessionValidationError("El formato del email no es válido");
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      throw new SessionValidationError(
        `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`,
      );
    }

    const existingUser = await usersRepository.findByEmail(normalizedEmail);

    if (existingUser) {
      throw new UserEmailConflictError();
    }

    const hashedPassword = await createHash(password);

    const newUser = {
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    };

    const createdUser = await usersRepository.create(newUser);

    const { password: _password, ...userWithoutPassword } = createdUser;

    return userWithoutPassword;
  }
}

export default new SessionsService();

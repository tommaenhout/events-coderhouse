import usersRepository from "../repositories/users.repository.js";
import { UserEmailConflictError } from "../errors/users.errors.js";
import { createHash } from "../utils/hash.js";

const MIN_PASSWORD_LENGTH = 8;

class SessionsService {
  async register(data) {
    const { first_name, last_name, email, password } = data;

    if (!first_name || !last_name || !email || !password) {
      throw new Error("Missing required fields");
    }

    const normalizedEmail = email.toLowerCase().trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      throw new Error("Invalid email format");
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long`);
    }

    const existingUser = await usersRepository.findByEmail(normalizedEmail);

    if (existingUser) {
      throw new UserEmailConflictError();
    }

    const hashedPassword = await createHash(password);

    const newUser = {
      first_name,
      last_name,
      email: normalizedEmail,
      password: hashedPassword,
    };

    const createdUser = await usersRepository.create(newUser);

    const { password: _password, ...userWithoutPassword } = createdUser;

    return userWithoutPassword;
  }
}

export default new SessionsService();

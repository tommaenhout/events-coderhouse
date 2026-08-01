export class UserValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "UserValidationError";
  }
}

export class UserNotFoundError extends Error {
  constructor() {
    super("Usuario no encontrado");
    this.name = "UserNotFoundError";
  }
}

export class UserEmailConflictError extends Error {
  constructor() {
    super("El email ya está registrado");
    this.name = "UserEmailConflictError";
  }
}

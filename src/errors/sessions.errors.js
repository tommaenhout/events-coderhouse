export class SessionValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "SessionValidationError";
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super("Credenciales inválidas");
    this.name = "InvalidCredentialsError";
  }
}

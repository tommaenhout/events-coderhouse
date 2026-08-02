export class SessionValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "SessionValidationError";
  }
}

import { UserEmailConflictError } from "../errors/users.errors.js";
import sessionsService from "../services/sessions.service.js";

export const register = async (request, response, next) => {
  try {
    const result = await sessionsService.register(request.body);
    return response.status(201).json({ status: "success", payload: result });
  } catch (error) {
    if (error instanceof UserEmailConflictError) {
      return response.status(409).json({
        status: "error",
        message: error.message,
      });
    }

    if (error instanceof Error) {
      return response.status(400).json({ status: "error", message: error.message });
    }

    return next(error);
  }
};

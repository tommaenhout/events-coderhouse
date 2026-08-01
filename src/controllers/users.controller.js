import {
  UserEmailConflictError,
  UserNotFoundError,
  UserValidationError,
} from "../errors/users.errors.js";

const handleServiceError = (error, response, next) => {
  if (error instanceof UserValidationError) {
    return response.status(400).json({ status: "error", message: error.message });
  }

  if (error instanceof UserNotFoundError) {
    return response.status(404).json({ status: "error", message: error.message });
  }

  if (error instanceof UserEmailConflictError) {
    return response.status(409).json({ status: "error", message: error.message });
  }

  return next(error);
};

export const createUsersController = ({ usersService }) => ({
  async getUsers(_request, response, next) {
    try {
      const users = await usersService.getUsers();
      return response.status(200).json({ status: "success", payload: users });
    } catch (error) {
      return handleServiceError(error, response, next);
    }
  },

  async getUserById(request, response, next) {
    try {
      const user = await usersService.getUserById(request.params.id);
      return response.status(200).json({ status: "success", payload: user });
    } catch (error) {
      return handleServiceError(error, response, next);
    }
  },

  async createUser(request, response, next) {
    try {
      const user = await usersService.createUser(request.body);
      return response.status(201).json({ status: "success", payload: user });
    } catch (error) {
      return handleServiceError(error, response, next);
    }
  },

  async updateUser(request, response, next) {
    try {
      const user = await usersService.updateUser(request.params.id, request.body);
      return response.status(200).json({ status: "success", payload: user });
    } catch (error) {
      return handleServiceError(error, response, next);
    }
  },

  async deleteUser(request, response, next) {
    try {
      const user = await usersService.deleteUser(request.params.id);
      return response.status(200).json({ status: "success", payload: user });
    } catch (error) {
      return handleServiceError(error, response, next);
    }
  },
});

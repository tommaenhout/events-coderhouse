import {
  UserEmailConflictError,
  UserNotFoundError,
  UserValidationError,
} from "../errors/users.errors.js";
import usersService from "../services/users.service.js";

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

export const getUsers = async (_request, response, next) => {
  try {
    const users = await usersService.getUsers();
    return response.status(200).json({ status: "success", payload: users });
  } catch (error) {
    return handleServiceError(error, response, next);
  }
};

export const getUserById = async (request, response, next) => {
  try {
    const user = await usersService.getUserById(request.params.id);
    return response.status(200).json({ status: "success", payload: user });
  } catch (error) {
    return handleServiceError(error, response, next);
  }
};

export const createUser = async (request, response, next) => {
  try {
    const user = await usersService.createUser(request.body);
    return response.status(201).json({ status: "success", payload: user });
  } catch (error) {
    return handleServiceError(error, response, next);
  }
};

export const updateUser = async (request, response, next) => {
  try {
    const user = await usersService.updateUser(request.params.id, request.body);
    return response.status(200).json({ status: "success", payload: user });
  } catch (error) {
    return handleServiceError(error, response, next);
  }
};

export const deleteUser = async (request, response, next) => {
  try {
    const user = await usersService.deleteUser(request.params.id);
    return response.status(200).json({ status: "success", payload: user });
  } catch (error) {
    return handleServiceError(error, response, next);
  }
};

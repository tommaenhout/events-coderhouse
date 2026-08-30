import {
  UserEmailConflictError,
  UserNotFoundError,
  UserValidationError,
} from "../errors/users.errors.js";
import usersService from "../services/users.service.js";

const handleServiceError = (error, res, next) => {
  if (error instanceof UserValidationError) {
    return res.status(400).json({ status: "error", message: error.message });
  }
  if (error instanceof UserNotFoundError) {
    return res.status(404).json({ status: "error", message: error.message });
  }
  if (error instanceof UserEmailConflictError) {
    return res.status(409).json({ status: "error", message: error.message });
  }
  return next(error);
};

export const getUsers = async (_req, res, next) => {
  try {
    const users = await usersService.getUsers();
    return res.status(200).json({ status: "success", payload: users });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const user = await usersService.getUserById(req.params.id);
    return res.status(200).json({ status: "success", payload: user });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const user = await usersService.updateUser(req.params.id, req.body);
    return res.status(200).json({ status: "success", payload: user });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const user = await usersService.deleteUser(req.params.id);
    return res.status(200).json({ status: "success", payload: user });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

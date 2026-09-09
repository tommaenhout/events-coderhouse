import usersService from "../services/users.service.js";
import { handleServiceError } from "../utils/handleServiceError.js";

export const getAllUsers = async (_req, res, next) => {
  try {
    const users = await usersService.getAllUsers();
    return res.status(200).json({ status: "success", payload: users });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

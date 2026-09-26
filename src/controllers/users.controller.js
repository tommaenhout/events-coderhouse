import usersService from "../services/users.service.js";
import { handleServiceError } from "../utils/handleServiceError.js";
import { PublicUserDTO } from "../dto/user.dto.js";

export const getAllUsers = async (_req, res, next) => {
  try {
    const users = await usersService.getAllUsers();
    return res.status(200).json({
      status: "success",
      payload: users.map((user) => new PublicUserDTO(user)),
    });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

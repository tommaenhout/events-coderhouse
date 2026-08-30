import { Router } from "express";

import {
  deleteUser,
  getUserById,
  getUsers,
  updateUser,
} from "../controllers/users.controller.js";

const usersRouter = Router();

usersRouter.get("/", getUsers);
usersRouter.get("/:id", getUserById);
usersRouter.put("/:id", updateUser);
usersRouter.delete("/:id", deleteUser);

export default usersRouter;

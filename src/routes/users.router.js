import { Router } from "express";

export const createUsersRouter = ({ usersController }) => {
  const usersRouter = Router();

  usersRouter.get("/", usersController.getUsers);
  usersRouter.get("/:id", usersController.getUserById);
  usersRouter.post("/", usersController.createUser);
  usersRouter.put("/:id", usersController.updateUser);
  usersRouter.delete("/:id", usersController.deleteUser);

  return usersRouter;
};

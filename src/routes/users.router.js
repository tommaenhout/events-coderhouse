import { Router } from "express";
import { getAllUsers } from "../controllers/users.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authorizeRole.js";

const usersRouter = Router();

usersRouter.get("/", authMiddleware, authorizeRoles(["admin"]), getAllUsers);

export default usersRouter;

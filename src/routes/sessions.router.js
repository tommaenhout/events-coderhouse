import { Router } from "express";
import { getCurrentUser, login, logout, refresh, register } from "../controllers/sessions.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout)
router.get("/current", authMiddleware, getCurrentUser)
router.post("/refresh", refresh)


export default router;

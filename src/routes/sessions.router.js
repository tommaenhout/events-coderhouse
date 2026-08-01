import { Router } from "express";

export const createSessionsRouter = ({ sessionsController }) => {
  const sessionsRouter = Router();

  sessionsRouter.get("/", sessionsController.getSessions);

  return sessionsRouter;
};

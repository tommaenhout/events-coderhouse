import passport from "passport";

import {
  UserEmailConflictError,
  UserValidationError,
} from "../errors/users.errors.js";

export const registerWithPassport = (req, res, next) => {
  passport.authenticate(
    "register",
    { session: false },
    (error, user, info, status) => {
      if (error instanceof UserValidationError) {
        return res.status(400).json({
          status: "error",
          message: error.message,
        });
      }

      if (error instanceof UserEmailConflictError) {
        return res.status(409).json({
          status: "error",
          message: error.message,
        });
      }

      if (error) {
        return next(error);
      }

      if (!user) {
        return res.status(status || 400).json({
          status: "error",
          message: info?.message || "Datos de registro invalidos",
        });
      }

      req.user = user;
      return next();
    },
  )(req, res, next);
};

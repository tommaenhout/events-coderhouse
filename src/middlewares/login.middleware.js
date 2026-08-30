import passport from "../config/passport.js";

export const loginWithPassport = (req, res, next) => {
  passport.authenticate(
    "login",
    { session: false },
    (error, user) => {
      if (error) {
        return next(error);
      }

      if (!user) {
        return res.status(401).json({
          status: "error",
          message: "Credenciales inválidas",
        });
      }

      req.user = {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
      };

      return next();
    },
  )(req, res, next);
};

import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { ExtractJwt, Strategy as JWTStrategy } from "passport-jwt";

import { env } from "./env.js";
import usersService from "../services/users.service.js";
import { InvalidCredentialsError } from "../errors/sessions.errors.js";

passport.use(
  "register",
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
      passReqToCallback: true,
    },
    async (req, email, password, done) => {
      try {
        const { first_name, last_name } = req.body;
        const user = await usersService.registerUser({
          first_name,
          last_name,
          email,
          password,
        });
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    },
  ),
);

passport.use(
  "login",
  new LocalStrategy(
    { usernameField: "email", passwordField: "password" },
    async (email, password, done) => {
      try {
        return done(null, await usersService.authenticate(email, password));
      } catch (error) {
        if (error instanceof InvalidCredentialsError) {
          return done(null, false, { message: "credenciales inválidas" });
        }
        return done(error);
      }
    },
  ),
);

const cookieExtractor = (req) => req?.cookies?.currentUser ?? null;

passport.use(
  "current",
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
      secretOrKey: env.jwtSecret,
    },
    async (payload, done) => {
      try {
        const user = await usersService.findAuthenticatedUser(payload.id);
        if (!user) {
          return done(null, false, { message: "Usuario no encontrado" });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    },
  ),
);

export default passport;

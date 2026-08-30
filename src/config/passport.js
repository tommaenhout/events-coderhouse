import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { ExtractJwt, Strategy as JWTStrategy } from "passport-jwt";

import { env } from "./env.js";
import usersService from "../services/users.service.js";
import usersRepository from "../repositories/users.repository.js";
import { validatePassword } from "../utils/hash.js";

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
        const newUser = await usersService.registerUser({
          first_name,
          last_name,
          email,
          password,
        });

        return done(null, newUser);
      } catch (error) {
        return done(error);
      }
    },
  ),
);

passport.use(
    "login",
    new LocalStrategy(
        {
            usernameField: "email",
            passwordField: "password"
        },
        async (email, password, done) => {
            try {
                const normalizedEmail = email.toLowerCase().trim();
                const user = await usersRepository.findByEmail(normalizedEmail);
                if (!user) {
                    return done(null, false, { message: "credenciales inválidas" });
                }

                const isPasswordValid = await validatePassword(password, user.password);

                if (!isPasswordValid) {
                    return done(null, false, { message: "credenciales inválidas" });
                }

                return done(null, user);
            } catch (error) {
                return done(error);
            }
        }
    )
)

const cookieExtractor = (req) => {
  if (req && req.cookies && req.cookies.currentUser) {
    return req.cookies.currentUser;
  }
  return null;
};

passport.use(
  "current",
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
      secretOrKey: env.jwtSecret,
    },
    async (payload, done) => {
      try {
        const user = await usersRepository.findById(payload.id);
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

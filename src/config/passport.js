import passport from 'passport';

import { Strategy as LocalStrategy } from 'passport-local';

import usersService from '../services/users.service.js';



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
                const {first_name, last_name} = req.body;
                if (!first_name || !last_name || !email || !password) {
                    return done(null, false, { message: "Todos los campos son obligatorios" });
                }
                const newUser = await usersService.registerUser({ first_name, last_name, email, password });
                return done(null, newUser);
            } catch (error) {
                if (error.code === "EMAIL_EXISTS") {
                    return done(null, false, { message: "El email ya está registrado" });
                }
                return done(error);
            }
        }
    )
)
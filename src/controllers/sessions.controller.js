import { env } from "../config/env.js";
import { generateJWT } from "../utils/jwt.js";
import { UserDTO } from "../dto/user.dto.js";

export const register = async (req, res) => {
  return res.status(201).json({
    message: "Usuario registrado exitosamente",
  });
}

export const login = async (req, res) => {
  try {
  const user = req.user;
  const token = generateJWT(user);

  res.cookie("currentUser", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: env.jwtCookieExpiresIn,
  });

  return res.status(200).json({
    status: "success",
    message: "Login exitoso",
  });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Error en el servidor al intentar iniciar sesión",
    });
  }
}

export const current = async (req, res) => {
  try {
  const user = req.user;

  const userDTO = new UserDTO(user);

  return res.status(200).json({
    status: "success",
    payload: userDTO,
  });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Error en el servidor al intentar obtener el usuario actual",
    });
  }
}

export const logout = async (req, res) => {
  res.clearCookie("currentUser")

  return res.status(200).json({
    status: "success",
    message: "Logout correcto",
  });
}

import {
  InvalidCredentialsError,
  SessionValidationError,
} from "../errors/sessions.errors.js";
import { UserEmailConflictError } from "../errors/users.errors.js";
import sessionsService from "../services/sessions.service.js";
import { generateJWT, generateRefreshToken, verifyRefreshToken } from "../utils/jwt.js";

export const register = async (req, res, next) => {
  try {
    const result = await sessionsService.register(req.body);
    return res.status(201).json({ status: "success", payload: result });
  } catch (error) {
    if (error instanceof UserEmailConflictError) {
      return res.status(409).json({
        status: "error",
        message: error.message,
      });
    }

    if (error instanceof SessionValidationError) {
      return res.status(400).json({ status: "error", message: error.message });
    }

    return next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const user = await sessionsService.login(req.body);
    const token = generateJWT(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie("currentUser", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    })

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    })

    return res.status(200).json({ status: "success", message: "Login correcto" });
  } catch (error) {
    if (error instanceof InvalidCredentialsError) {
      return res.status(401).json({
        status: "error",
        message: error.message,
      });
    }

    return next(error);
  }
}

export const logout = async (req, res, next) => {
  res.clearCookie("currentUser");
  res.clearCookie("refreshToken");

  return res.status(200).json({
    status: "success",
    message: "logout correcto"
  })
}

export const getCurrentUser = async (req, res, next) => {
  return res.status(200).json({
    status: "success",
    payload: req.user
  })
}

export const refresh = async(req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken
    if(!refreshToken){
      return res.status(401).json({
        status: "error",
        message: "refresh token no encontrado"
      })
    }
    const decode = verifyRefreshToken(refreshToken)
    const accesstoken = generateJWT({id: decode.id})

    res.cookie("currentUser", accesstoken, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    })

    return res.status(200).json({
      status: "success",
      message: "token renovado"
    })
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message
    })
  }
}

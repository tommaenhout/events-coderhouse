import { verifyJWT } from "../utils/jwt.js";

export const authMiddleware = (req, res, next) => {
  try {
    const token = req.cookies.currentUser;
    if (!token) {
      return res.status(401).json({ 
        status: "error",
        message: "No autenticado"
      });
    }
    const decoded = verifyJWT(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ 
      status: "error",
      message: "Token inválido o expirado"
    });
  }
}

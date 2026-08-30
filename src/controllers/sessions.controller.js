export const register = async (req, res) => {
  return res.status(201).json({
    message: "Usuario registrado exitosamente",
  });
}
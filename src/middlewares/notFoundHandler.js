export const notFoundHandler = (_request, response) => {
  response.status(404).json({
    status: "error",
    message: "Ruta no encontrada",
  });
};

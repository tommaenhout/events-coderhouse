export const createErrorHandler = ({ logger = console } = {}) =>
  (error, _request, response, _next) => {
    const isBadRequest =
      error.name === "CastError" ||
      error.name === "ValidationError" ||
      (error instanceof SyntaxError && error.status === 400);

    if (isBadRequest) {
      response.status(400).json({
        status: "error",
        message: "Solicitud inválida",
      });
      return;
    }

    logger.error(error);
    response.status(500).json({
      status: "error",
      message: "Error interno del servidor",
    });
  };

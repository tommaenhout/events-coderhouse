export const createErrorHandler = ({ logger = console } = {}) =>
  (error, _req, res, _next) => {
    if (Number.isInteger(error.statusCode)) {
      if (error.statusCode >= 500) logger.error(error);
      res.status(error.statusCode).json({
        status: "error",
        message: error.statusCode >= 500 ? "Error interno del servidor" : error.message,
      });
      return;
    }
    const isBadRequest =
      error.name === "CastError" ||
      error.name === "ValidationError" ||
      (error instanceof SyntaxError && error.status === 400);

    if (isBadRequest) {
      res.status(400).json({
        status: "error",
        message: "Solicitud inválida",
      });
      return;
    }

    logger.error(error);
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor",
    });
  };

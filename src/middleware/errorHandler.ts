import type { ErrorRequestHandler } from "express";
import { HttpError } from "../errors/http.error";

export const errorHandler: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next,
) => {
  if (error instanceof HttpError) {
    return res.status(error.statusCode).json({
      message: error.message,
      ...(error.code ? { code: error.code } : {}),
    });
  }

  console.error(error);

  return res.status(500).json({
    message: "Internal server error",
    code: "INTERNAL_SERVER_ERROR",
  });
};

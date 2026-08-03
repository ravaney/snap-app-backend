import { NextFunction, Request, Response } from "express";

export const requireIdempotencyKey = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const idempotencyKey = req.get("Idempotency-Key");
  if (!idempotencyKey) {
    return res
      .status(400)
      .json({ message: "Idempotency-Key header is required" });
  }
  res.locals.idempotencyKey = idempotencyKey;
  next();
};

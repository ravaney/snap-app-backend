import { NextFunction, Request, Response } from "express";
import { ZodType } from "zod";

export const validate = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const validationResult = schema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validationResult.error.issues,
      });
    }
    req.body = validationResult.data;
    next();
  };
};

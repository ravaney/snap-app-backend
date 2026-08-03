import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const token = authorization.slice("Bearer ".length);
  const secret = process.env.JWT_ACCESS_SECRET;

  if (!secret) {
    return res.status(500).json({ message: "Authentication unavailable" });
  }

  try {
    const payload = jwt.verify(token, secret, {
      issuer: "snap-app-api",
      audience: "snap-app-client",
    }) as JwtPayload;

    if (typeof payload.sub !== "string") {
      return res.status(401).json({ message: "Invalid access token" });
    }

    req.auth = {
      userId: payload.sub,
    };

    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired access token" });
  }
};

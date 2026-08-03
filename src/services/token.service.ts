import jwt from "jsonwebtoken";
import crypto from "node:crypto";
type AccessTokenUser = {
  id: string;
  role: string;
};

export const tokenService = {
  createAccessToken(user: AccessTokenUser) {
    const accessTokenSecret = process.env.JWT_ACCESS_SECRET;
    if (!accessTokenSecret) {
      throw new Error("JWT_ACCESS_SECRET is not configured");
    }

    return jwt.sign(
      {
        sub: user.id,
        role: user.role,
      },
      accessTokenSecret,
      {
        expiresIn: "15m",
        issuer: "snap-app-api",
        audience: "snap-app-client",
      },
    );
  },

  createRefreshToken() {
    return crypto.randomBytes(48).toString("hex");
  },

  hashRefreshToken(token: string) {
    return crypto.createHash("sha256").update(token).digest("hex");
  },
};

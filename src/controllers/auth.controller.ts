import { NextFunction, request, response } from "express";
import { authService } from "../services/auth.service";

const getCookie = (cookieHeader: string | undefined, name: string) => {
  if (!cookieHeader) return undefined;

  for (const cookie of cookieHeader.split(";")) {
    const [cookieName, ...valueParts] = cookie.trim().split("=");
    if (cookieName === name) {
      return decodeURIComponent(valueParts.join("="));
    }
  }

  return undefined;
};

export const authController = {
  async login(req: typeof request, res: typeof response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);

      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/api/auth",
      });
      return res.status(200).json({
        user: result.user,
        accessToken: result.accessToken,
      });
    } catch (error) {
      next(error);
    }
  },
  async logout(req: typeof request, res: typeof response, next: NextFunction) {
    try {
      const refreshToken = getCookie(req.headers.cookie, "refreshToken");
      await authService.logout(refreshToken);

      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/api/auth",
      });

      return res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  },
  async refresh(req: typeof request, res: typeof response, next: NextFunction) {
    try {
      const refreshToken = getCookie(req.headers.cookie, "refreshToken");
      if (!refreshToken) {
        return res.status(401).json({ message: "Missing refresh token" });
      }

      const result = await authService.refresh(refreshToken);

      if (!result) {
        res.clearCookie("refreshToken", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          path: "/api/auth",
        });
        return res.status(401).json({ message: "Invalid refresh token" });
      }

      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/api/auth",
      });

      return res.status(200).json({
        data: {
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};

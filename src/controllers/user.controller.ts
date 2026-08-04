import type { Request, RequestHandler, Response } from "express";
import { userService } from "../services/user.service";

const serializeForJson = (value: unknown): unknown => {
  if (typeof value === "bigint") {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => serializeForJson(item));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entryValue]) => [
        key,
        serializeForJson(entryValue),
      ]),
    );
  }

  return value;
};

export const signupController = async (req: Request, res: Response) => {
  try {
    const newUser = await userService.signup(req.body);
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : "Error occurred",
    });
  }
};

export const meController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const user = await userService.getMe(req.auth.userId);

    return res.status(200).json(
      serializeForJson({
        ...user,
        wallet: user?.wallet
          ? {
              ...user.wallet,
              balanceMinor: user.wallet.balanceMinor.toString(),
            }
          : null,
      }),
    );
  } catch (error) {
    next(error);
  }
};

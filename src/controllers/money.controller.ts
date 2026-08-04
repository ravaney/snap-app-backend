import { NextFunction, Request, Response } from "express";
import { moneyServices } from "../services/money.service";

export const moneyController = {
  async transfer(req: Request, res: Response, next: NextFunction) {
    try {
      const senderId = req.auth?.userId;
      if (!senderId) throw new Error("Authentication required");
      const { isDuplicate } = await moneyServices.transfer({
        senderUserId: senderId,
        receiverAccountId: req.body.walletId,
        amountMinor: req.body.amountMinor,
        description: req.body.description,
        idempotencyKey: res.locals.idempotencyKey,
      });
      if (isDuplicate) {
        return res.status(200).json({ message: "Transfer already processed" });
      }
      return res.status(201).json({ message: "Transfer successful" });
    } catch (error) {
      next(error);
    }
  },
  async deposit(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth?.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { amountMinor, description } = req.body;

      const { isDuplicate } = await moneyServices.deposit({
        authenticatedUserId: req.auth.userId,
        amountMinor,
        description,
        idempotencyKey: res.locals.idempotencyKey,
      });
      if (isDuplicate) {
        return res.status(200).json({ message: "Transfer already processed" });
      }

      return res.status(201).json({ message: "Transfer Successful" });
    } catch (error) {
      next(error);
    }
  },
  async withdraw(req: Request, res: Response, next: NextFunction) {},
  async refund(req: Request, res: Response, next: NextFunction) {
    try {
      // Implement the logic for refunding a transfer
      return res.status(200).json({ message: "Refund transfer successful" });
    } catch (error) {
      next(error);
    }
  },
};

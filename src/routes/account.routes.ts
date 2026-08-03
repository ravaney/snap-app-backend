import express from "express";
import { moneyController } from "../controllers/money.controller";
import { requireAuth } from "../middleware/requireAuth";
import { validate } from "../middleware/validate";
import { snapTransferSchema } from "../schemas/snapTransfer";
import { requireIdempotencyKey } from "../middleware/requireIdempotencyKey";

const router = express.Router();

// router.post("/debit", requireAuth, transactionController.debitAccountBalance);
router.post(
  "/transfer",
  requireAuth,
  requireIdempotencyKey,
  validate(snapTransferSchema),
  moneyController.transfer,
);
router.post("/bankcredit", requireAuth, moneyController.deposit);

export default router;

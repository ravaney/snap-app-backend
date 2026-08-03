import { DatabaseClient } from "../config/database";
import {
  Prisma,
  TransactionStatus,
  TransactionType,
} from "../generated/prisma";

export type CreateAccountTransactionData = {
  walletId: string;
  type: TransactionType;
  amountMinor: bigint;
  balanceAfterMinor: bigint;
  status: TransactionStatus;
  direction: "CREDIT" | "DEBIT";
  idempotencyKey: string;
  relatedWalletId: string;
  completedAt: Date | null;
  description?: string;
  metadata?: Prisma.InputJsonValue | null;
};

export const transactionRepository = {
  createWalletTransaction(
    data: CreateAccountTransactionData,
    prisma: DatabaseClient,
  ) {
    return prisma.walletTransaction.create({ data });
  },

  findTransactionByIdempotencyKey(
    idempotencyKey: string,
    prisma: DatabaseClient,
  ) {
    return prisma.walletTransaction.findUnique({
      where: { idempotencyKey },
    });
  },

  findTransactionsByAccountId(
    walletId: string,
    take = 20,
    prisma: DatabaseClient,
  ) {
    return prisma.walletTransaction.findMany({
      where: { walletId },
      orderBy: { createdAt: "desc" },
      take,
    });
  },
  markCompleted() {},
};

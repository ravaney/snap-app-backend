import { DatabaseClient } from "../config/database";
import { TransactionType } from "../generated/prisma";

export type AccountBalanceOperation = {
  accountId: string;
  amountMinor: bigint;
  type: TransactionType;
  description?: string;
  idempotencyKey?: string;
};

export type WalletStatus = {
  walletId: string;
  status: "ACTIVE" | "SUSPENDED" | "CLOSED";
};

export const walletRepository = {
  findByUserId(userId: string, prisma: DatabaseClient) {
    return prisma.wallet.findUnique({
      where: { userId },
    });
  },

  findByWalletId(id: string, prisma: DatabaseClient) {
    return prisma.wallet.findUnique({
      where: { id },
    });
  },

  creditWalletBalance(data: AccountBalanceOperation, prisma: DatabaseClient) {
    return prisma.wallet.update({
      where: { id: data.accountId },
      data: {
        balanceMinor: {
          increment: data.amountMinor,
        },
      },
    });
  },

  debitWalletBalanceIfSufficient(
    data: AccountBalanceOperation,
    prisma: DatabaseClient,
  ) {
    return prisma.wallet.updateMany({
      where: {
        id: data.accountId,
        balanceMinor: {
          gte: data.amountMinor,
        },
      },
      data: {
        balanceMinor: {
          decrement: data.amountMinor,
        },
      },
    });
  },
  setStatus(data: WalletStatus, prisma: DatabaseClient) {
    return prisma.wallet.update({
      where: { id: data.walletId },
      data: {
        status: data.status,
      },
    });
  },
};

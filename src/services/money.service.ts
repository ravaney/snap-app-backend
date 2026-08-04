import { prisma } from "../config/database";
import { Prisma } from "../generated/prisma";
import { walletRepository } from "../repositories/wallet.repository";
import { transactionRepository } from "../repositories/transaction.repository";

export type TransferOperation = {
  senderUserId: string;
  receiverAccountId: string;
  amountMinor: bigint;
  description?: string;
  idempotencyKey: string;
};

export type BankDepositOperation = {
  authenticatedUserId: string;
  amountMinor: bigint;
  description?: string;
  idempotencyKey: string;
};

export const moneyServices = {
  async transfer(data: TransferOperation): Promise<{ isDuplicate: boolean }> {
    let isDuplicate = false;
    await prisma.$transaction(async (tx) => {
      const senderAccount = await walletRepository.findByUserId(
        data.senderUserId,
        tx,
      );
      if (!senderAccount) throw new Error("Sender account not found");
      const receiverAccount = await walletRepository.findByWalletId(
        data.receiverAccountId,
        tx,
      );
      if (!receiverAccount) throw new Error("Receiver account not found");

      try {
        await transactionRepository.createWalletTransaction(
          {
            walletId: senderAccount.id,
            type: "TRANSFER",
            amountMinor: data.amountMinor,
            balanceAfterMinor:
              BigInt(senderAccount.balanceMinor) - BigInt(data.amountMinor),
            status: "PENDING",
            direction: "DEBIT",
            idempotencyKey: `${data.idempotencyKey}-debit`,
            relatedId: receiverAccount.id,
            completedAt: null,
            description: data.description,
          },
          tx,
        );
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          isDuplicate = true;
          return; // If the transaction already exists, we can safely return without doing anything
        }
        throw error;
      }

      const debitResult = await walletRepository.debitWalletBalanceIfSufficient(
        {
          amountMinor: data.amountMinor,
          accountId: senderAccount.id,
          type: "TRANSFER",
          description: data.description,
        },
        tx,
      );
      if (debitResult.count === 0)
        throw new Error("Insufficient balance for transfer");

      await walletRepository.creditWalletBalance(
        {
          amountMinor: data.amountMinor,
          accountId: receiverAccount.id,
          type: "TRANSFER",
          description: data.description,
        },
        tx,
      );

      await transactionRepository.createWalletTransaction(
        {
          walletId: receiverAccount.id,
          type: "TRANSFER",
          amountMinor: data.amountMinor,
          balanceAfterMinor:
            BigInt(receiverAccount.balanceMinor) + BigInt(data.amountMinor),
          status: "COMPLETED",
          direction: "CREDIT",
          idempotencyKey: `${data.idempotencyKey}-credit`,
          relatedId: senderAccount.id,
          description: data.description,
          completedAt: new Date(),
        },
        tx,
      );
      await tx.walletTransaction.update({
        where: { idempotencyKey: `${data.idempotencyKey}-debit` },
        data: { status: "COMPLETED", completedAt: new Date() },
      });
    });
    return { isDuplicate };
  },
  async deposit(data: BankDepositOperation): Promise<{ isDuplicate: boolean }> {
    let isDuplicate = false;
    await prisma.$transaction(async (tx) => {
      const wallet = await walletRepository.findByUserId(
        data.authenticatedUserId,
        tx,
      );

      if (!wallet) {
        throw new Error("User account not found");
      }
      try {
        await transactionRepository.createWalletTransaction(
          {
            walletId: wallet.id,
            type: "DEPOSIT",
            amountMinor: data.amountMinor,
            balanceAfterMinor:
              BigInt(wallet.balanceMinor) + BigInt(data.amountMinor),
            status: "PENDING",
            direction: "CREDIT",
            idempotencyKey: `${data.idempotencyKey}-credit`,
            relatedId: wallet.id,
            completedAt: null,
            description: data.description,
          },
          tx,
        );
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          isDuplicate = true;
          return; // If the transaction already exists, we can safely return without doing anything
        }
        throw error;
      }
      await walletRepository.creditWalletBalance(
        {
          amountMinor: data.amountMinor,
          accountId: wallet.id,
          type: "DEPOSIT",
          description: data.description,
        },
        tx,
      );
      await tx.walletTransaction.update({
        where: { idempotencyKey: `${data.idempotencyKey}-credit` },
        data: { status: "COMPLETED", completedAt: new Date() },
      });
    });
    return { isDuplicate };
  },
  async withdraw() {},
  async refundTransfer() {},
};

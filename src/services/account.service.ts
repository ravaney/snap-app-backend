export type AccountOperationInput = {
  userId: string;
  amountMinor: bigint;
  idempotencyKey: string;
  description?: string;
};

export type AccountResult = {
  id: string;
  userId: string;
  currency: string;
  balanceMinor: bigint;
  createdAt: Date;
  updatedAt: Date;
};

export type AccountOperationResult = {
  transactionId: string;
  accountId: string;
  amountMinor: bigint;
  balanceMinor: bigint;
  status: "COMPLETED";
};

export type TransferInput = AccountOperationInput & {
  recipientUserId: string;
};

export type TransferResult = {
  debitTransactionId: string;
  creditTransactionId: string;
  senderAccountId: string;
  recipientAccountId: string;
  amountMinor: bigint;
  senderBalanceMinor: bigint;
  status: "COMPLETED";
};

export const accountService = {
  async getMyAccount(userId: string) {},
  async getBalance(userId: string) {},
  async deposit(userId: string, input: string) {},
  async withdraw(userId: string, input: AccountOperationInput) {},
  async transfer(
    senderId: string,
    recipientId: string,
    input: AccountOperationInput,
  ) {},
};

import * as z from "zod";

export const snapTransferSchema = z.object({
  walletId: z.string(),
  amountMinor: z
    .number()
    .int()
    .min(1, "Must be at least $1.00")
    .max(100000000, "Cannot exceed $1,000,000.00"),
  description: z.string().trim().max(255).optional(),
});

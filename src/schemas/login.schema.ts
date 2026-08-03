import * as z from "zod";

export const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
  method: z.enum(["PHONE", "EMAIL", "SNAPTAG"]),
});

export type LoginInput = z.infer<typeof loginSchema>;

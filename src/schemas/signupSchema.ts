import * as z from "zod";

const optionalString = <T extends z.ZodType<string>>(schema: T) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    schema.optional(),
  );

export const createUser = z
  .object({
    firstName: z.string().trim().min(1),
    lastName: z.string().trim().min(1),
    email: optionalString(z.email()),
    phone: optionalString(z.string().trim().min(10)),
    password: z.string().trim(),
    snapTag: z.string().trim().startsWith("@"),
  })
  .refine((data) => Boolean(data.email || data.phone), {
    message: "Email or phone is required",
    path: ["email", "phone"],
  });

export type CreateUser = z.infer<typeof createUser>;

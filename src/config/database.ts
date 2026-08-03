import { Prisma, PrismaClient } from "../generated/prisma/client";

export const prisma = new PrismaClient();
export type DatabaseClient = typeof prisma | Prisma.TransactionClient;

export const connectDatabase = async (): Promise<void> => {
  await prisma.$connect();
  console.log("Database connected with Prisma");
};

export const disconnectDatabase = async (): Promise<void> => {
  await prisma.$disconnect();
};

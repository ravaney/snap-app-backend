import { prisma } from "../config/database";
import type { Prisma } from "../generated/prisma/client";

const loginUserSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  snapTag: true,
  passwordHash: true,
} satisfies Prisma.UserSelect;

const currentUserSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  snapTag: true,
  wallet: {
    select: {
      id: true,
      currency: true,
      balanceMinor: true,
      createdAt: true,
      updatedAt: true,
      transactions: {
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      },
    },
  },
} satisfies Prisma.UserSelect;

const publicUserSelect = {
  id: true,
  firstName: true,
  lastName: true,
  snapTag: true,
} satisfies Prisma.UserSelect;

type UserData = {
  firstName: string;
  lastName: string;
  email?: string;
  snapTag: string;
  passwordHash: string;
  phone?: string;
};
type UpdatePayload = {
  id: string;
} & Partial<UserData>;

export type PublicUserResult = {
  id: string;
  firstName: string;
  lastName: string;
  snapTag: string;
};

export const userRepository = {
  async findExistingUser(fields: {
    email?: string;
    phone?: string;
    snapTag?: string;
  }) {
    const { email, phone, snapTag } = fields;
    const orConditions = [];
    if (email) orConditions.push({ email });
    if (phone) orConditions.push({ phone });
    if (snapTag) orConditions.push({ snapTag });
    if (orConditions.length === 0) return null;

    const user = await prisma.user.findFirst({
      where: { OR: orConditions },
      select: { id: true, email: true, phone: true, snapTag: true },
    });

    if (!user) return null;

    let matchedField = "";
    if (email && user.email === email) matchedField = "email";
    else if (phone && user.phone === phone) matchedField = "phone";
    else if (snapTag && user.snapTag === snapTag) matchedField = "snapTag";

    return { id: user.id, field: matchedField };
  },
  findByEmail(email: string) {
    return prisma.user.findFirst({
      where: { email },
      select: loginUserSelect,
    });
  },

  findBySnapId(snapTag: string) {
    return prisma.user.findUnique({
      where: { snapTag },
      select: loginUserSelect,
    });
  },

  findByPhone(phone: string) {
    return prisma.user.findFirst({
      where: { phone },
      select: loginUserSelect,
    });
  },

  findCurrentUserById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: currentUserSelect,
    });
  },
  searchPublicUsers(query: string) {
    return prisma.user.findMany({
      where: {
        OR: [
          { firstName: { contains: query, mode: "insensitive" } },
          { lastName: { contains: query, mode: "insensitive" } },
          { snapTag: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        firstName: true,
        lastName: true,
        snapTag: true,
        wallet: { select: { id: true } },
      },
      take: 20,
    });
  },
  //implemented
  create(data: UserData) {
    return prisma.user.create({
      data: {
        ...data,
        wallet: {
          create: {},
        },
      },
      select: {
        id: true,
        email: true,
      },
    });
  },

  delete(id: string) {
    return prisma.user.delete({
      where: { id },
    });
  },

  update(data: UpdatePayload) {
    return prisma.user.update({
      where: { id: data.id },
      data: { ...data },
    });
  },

  findPublicUserByIdentifier(identifier: string) {
    const normalizedIdentifier = identifier.trim();

    return prisma.user.findFirst({
      where: {
        OR: [
          {
            email: normalizedIdentifier.toLowerCase(),
          },
          {
            phone: normalizedIdentifier,
          },
          {
            snapTag: normalizedIdentifier,
          },
        ],
      },
      select: publicUserSelect,
    });
  },
};

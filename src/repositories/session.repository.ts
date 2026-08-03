import { prisma } from "../config/database";
type CreateSessionData = {
  userId: string;
  refreshTokenHash: string;
  expiresAt: Date;
};

export const sessionRepository = {
  async createSessionData(data: CreateSessionData) {
    return prisma.session.create({
      data,
    });
  },

  async deleteByRefreshTokenHash(refreshTokenHash: string) {
    return prisma.session.deleteMany({
      where: { refreshTokenHash },
    });
  },

  async findByRefreshTokenHash(refreshTokenHash: string) {
    return prisma.session.findFirst({
      where: {
        refreshTokenHash,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });
  },

  async rotateRefreshToken(
    id: string,
    currentRefreshTokenHash: string,
    newRefreshTokenHash: string,
    expiresAt: Date,
  ) {
    return prisma.session.updateMany({
      where: {
        id,
        refreshTokenHash: currentRefreshTokenHash,
        expiresAt: { gt: new Date() },
      },
      data: {
        refreshTokenHash: newRefreshTokenHash,
        expiresAt,
      },
    });
  },
};

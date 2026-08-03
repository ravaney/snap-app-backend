import bcrypt from "bcrypt";
import { LoginInput, loginSchema } from "../schemas/login.schema";
import { userRepository } from "../repositories/user.repository";
import { tokenService } from "./token.service";
import { sessionRepository } from "../repositories/session.repository";

export const authService = {
  async login(input: LoginInput) {
    const validatedInput = loginSchema.parse(input);
    try {
      const user =
        validatedInput.method === "EMAIL"
          ? await userRepository.findByEmail(input.username)
          : validatedInput.method === "PHONE"
            ? await userRepository.findByPhone(input.username)
            : await userRepository.findBySnapId(input.username);

      if (!user) {
        throw new Error("User doesnt exist");
      }

      const passwordMatches = await bcrypt.compare(
        input.password,
        user.passwordHash,
      );
      if (!passwordMatches) throw new Error("Invalid username or password");

      const accessToken = tokenService.createAccessToken({
        id: user.id,
        role: user.firstName,
      });

      const refreshToken = tokenService.createRefreshToken();
      const refreshTokenHash = tokenService.hashRefreshToken(refreshToken);

      await sessionRepository.createSessionData({
        userId: user.id,
        refreshTokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      return {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          snapTag: user.snapTag,
        },
        accessToken,
        refreshToken,
      };
    } catch (error) {
      throw error;
    }
  },

  async logout(refreshToken?: string) {
    if (!refreshToken) return;

    const refreshTokenHash = tokenService.hashRefreshToken(refreshToken);
    await sessionRepository.deleteByRefreshTokenHash(refreshTokenHash);
  },

  async refresh(refreshToken?: string) {
    if (!refreshToken) return null;

    const currentRefreshTokenHash = tokenService.hashRefreshToken(refreshToken);
    const session = await sessionRepository.findByRefreshTokenHash(
      currentRefreshTokenHash,
    );

    if (
      !session ||
      session.revokedAt ||
      session.expiresAt.getTime() <= Date.now()
    ) {
      return null;
    }

    const newRefreshToken = tokenService.createRefreshToken();
    const newRefreshTokenHash = tokenService.hashRefreshToken(newRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const rotatedSession = await sessionRepository.rotateRefreshToken(
      session.id,
      currentRefreshTokenHash,
      newRefreshTokenHash,
      expiresAt,
    );

    if (rotatedSession.count !== 1) return null;

    const accessToken = tokenService.createAccessToken({
      id: session.user.id,
      role: session.user.firstName,
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  },
};

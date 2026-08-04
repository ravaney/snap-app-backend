import bcrypt from "bcrypt";
import { LoginInput, loginSchema } from "../schemas/login.schema";
import { userRepository } from "../repositories/user.repository";
import { tokenService } from "./token.service";
import { sessionRepository } from "../repositories/session.repository";
import { HttpError } from "../errors/http.error";

export const authService = {
  async login(input: LoginInput) {
    const validatedInput = loginSchema.parse(input);
    const user =
      validatedInput.method === "EMAIL"
        ? await userRepository.findByEmail(input.username)
        : validatedInput.method === "PHONE"
          ? await userRepository.findByPhone(input.username)
          : await userRepository.findBySnapId(input.username);

    if (!user) {
      throw new HttpError(
        401,
        "Invalid username or password",
        "INVALID_CREDENTIALS",
      );
    }

    const passwordMatches = await bcrypt.compare(
      input.password,
      user.passwordHash,
    );
    if (!passwordMatches) {
      throw new HttpError(
        401,
        "Invalid username or password",
        "INVALID_CREDENTIALS",
      );
    }

    const accessToken = tokenService.createAccessToken({
      id: user.id,
      role: user.firstName,
    });

    const refreshToken = tokenService.createRefreshToken();
    const refreshTokenHash = tokenService.hashRefreshToken(refreshToken);

    await sessionRepository.createSessionData({
      userId: user.id,
      refreshTokenHash,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
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

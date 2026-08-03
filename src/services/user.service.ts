import { userRepository } from "../repositories/user.repository";
import bcrypt from "bcrypt";
import { CreateUser } from "../schemas/signupSchema";

export const userService = {
  async signup(userData: CreateUser) {
    const existing = await userRepository.findExistingUser({
      email: userData.email,
      phone: userData.phone,
      snapTag: userData.snapTag,
    });

    if (existing) {
      throw new Error(
        `${existing.field.charAt(0).toUpperCase() + existing.field.slice(1)} already taken`,
      );
    }

    const passwordHash = await bcrypt.hash(userData.password, 10);

    return await userRepository.create({
      firstName: userData.firstName,
      lastName: userData.lastName,
      ...(userData.email ? { email: userData.email } : {}),
      ...(userData.phone ? { phone: userData.phone } : {}),
      snapTag: userData.snapTag,
      passwordHash,
    });
  },
  async getMe(userId: string) {
    const user = await userRepository.findCurrentUserById(userId);
    if (!user) throw new Error("User not found");
    return user;
  },
};

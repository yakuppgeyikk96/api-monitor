import type { FastifyInstance } from "fastify";
import type { AuthUser, RegisterInput, LoginInput } from "@repo/shared-types/auth";
import { ErrorCode, ErrorMessage } from "@repo/shared-types/errors";
import type { UserRepository } from "../users/user.repository.js";
import type { JwtPayload } from "../../common/jwt.js";
import { AuthError } from "../../common/errors.js";
import { hashPassword, verifyPassword } from "../../common/password.js";

interface AuthResult {
  token: string;
  user: AuthUser;
}

export function createAuthService(
  fastify: FastifyInstance,
  userRepository: UserRepository,
) {
  function toAuthUser(user: { id: number; email: string; fullName: string; avatarUrl: string | null }): AuthUser {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
    };
  }

  return {
    async register(input: RegisterInput): Promise<AuthResult> {
      const existing = await userRepository.findByEmail(input.email);
      if (existing) {
        throw new AuthError(ErrorCode.EMAIL_TAKEN, ErrorMessage.EMAIL_TAKEN);
      }

      const passwordHash = await hashPassword(input.password);

      const user = await userRepository.create({
        email: input.email,
        passwordHash,
        fullName: input.fullName,
      });

      const payload: JwtPayload = { sub: user.id, email: user.email };
      const token = fastify.jwt.sign(payload);

      return { token, user: toAuthUser(user) };
    },

    async login(input: LoginInput): Promise<AuthResult> {
      const user = await userRepository.findByEmail(input.email);
      if (!user) {
        throw new AuthError(ErrorCode.INVALID_CREDENTIALS, ErrorMessage.INVALID_CREDENTIALS);
      }

      const valid = await verifyPassword(user.passwordHash, input.password);
      if (!valid) {
        throw new AuthError(ErrorCode.INVALID_CREDENTIALS, ErrorMessage.INVALID_CREDENTIALS);
      }

      const payload: JwtPayload = { sub: user.id, email: user.email };
      const token = fastify.jwt.sign(payload);

      return { token, user: toAuthUser(user) };
    },

    async me(userId: number): Promise<AuthUser> {
      const user = await userRepository.findById(userId);
      if (!user) {
        throw new AuthError(ErrorCode.USER_NOT_FOUND, ErrorMessage.USER_NOT_FOUND);
      }

      return toAuthUser(user);
    },
  };
}

export type AuthService = ReturnType<typeof createAuthService>;

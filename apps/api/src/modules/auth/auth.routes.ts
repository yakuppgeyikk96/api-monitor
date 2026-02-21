import type { FastifyInstance } from "fastify";
import { createUserRepository } from "../users/user.repository.js";
import { createAuthService } from "./auth.service.js";
import { JWT_CONFIG } from "../../common/jwt.js";
import {
  RegisterBodySchema,
  LoginBodySchema,
  type RegisterBody,
  type LoginBody,
} from "./auth.schema.js";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export default async function authRoutes(fastify: FastifyInstance) {
  const userRepository = createUserRepository(fastify.db);
  const authService = createAuthService(fastify, userRepository);

  fastify.post<{ Body: RegisterBody }>(
    "/register",
    { schema: { body: RegisterBodySchema } },
    async (request, reply) => {
      const { token, user } = await authService.register(request.body);
      reply
        .setCookie(JWT_CONFIG.cookieName, token, COOKIE_OPTIONS)
        .code(201)
        .send({ success: true, data: user });
    },
  );

  fastify.post<{ Body: LoginBody }>(
    "/login",
    { schema: { body: LoginBodySchema } },
    async (request, reply) => {
      const { token, user } = await authService.login(request.body);
      reply
        .setCookie(JWT_CONFIG.cookieName, token, COOKIE_OPTIONS)
        .send({ success: true, data: user });
    },
  );

  fastify.post(
    "/logout",
    { preHandler: [fastify.authenticate] },
    async (_request, reply) => {
      reply
        .clearCookie(JWT_CONFIG.cookieName, COOKIE_OPTIONS)
        .send({ success: true, data: null });
    },
  );

  fastify.get(
    "/me",
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const user = await authService.me(request.user.sub);
      return { success: true, data: user };
    },
  );
}

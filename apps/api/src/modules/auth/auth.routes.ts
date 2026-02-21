import type { FastifyInstance } from "fastify";
import { createUserRepository } from "../users/user.repository.js";
import { createAuthService } from "./auth.service.js";
import {
  RegisterBodySchema,
  LoginBodySchema,
  type RegisterBody,
  type LoginBody,
} from "./auth.schema.js";

export default async function authRoutes(fastify: FastifyInstance) {
  const userRepository = createUserRepository(fastify.db);
  const authService = createAuthService(fastify, userRepository);

  fastify.post<{ Body: RegisterBody }>(
    "/register",
    { schema: { body: RegisterBodySchema } },
    async (request, reply) => {
      const result = await authService.register(request.body);
      reply.code(201).send({ success: true, data: result });
    },
  );

  fastify.post<{ Body: LoginBody }>(
    "/login",
    { schema: { body: LoginBodySchema } },
    async (request) => {
      const result = await authService.login(request.body);
      return { success: true, data: result };
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

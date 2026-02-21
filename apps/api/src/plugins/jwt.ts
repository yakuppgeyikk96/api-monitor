import fp from "fastify-plugin";
import fastifyJwt from "@fastify/jwt";
import type { FastifyInstance } from "fastify";
import { JWT_CONFIG } from "../common/jwt.js";

async function jwtPlugin(fastify: FastifyInstance) {
  fastify.register(fastifyJwt, {
    secret: process.env.JWT_SECRET!,
    sign: {
      expiresIn: JWT_CONFIG.expiresIn,
    },
  });
}

export default fp(jwtPlugin, { name: "jwt" });

import fp from "fastify-plugin";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { ErrorCode, ErrorMessage } from "@repo/shared-types/errors";

async function authPlugin(fastify: FastifyInstance) {
  fastify.decorate(
    "authenticate",
    async function (request: FastifyRequest, reply: FastifyReply) {
      try {
        await request.jwtVerify();
      } catch {
        reply.code(401).send({
          success: false,
          error: {
            code: ErrorCode.UNAUTHORIZED,
            message: ErrorMessage.UNAUTHORIZED,
          },
        });
      }
    },
  );
}

export default fp(authPlugin, {
  name: "auth",
  dependencies: ["jwt"],
});

import fastify from "fastify";
import dbPlugin from "./plugins/db.js";
import cookiePlugin from "./plugins/cookie.js";
import jwtPlugin from "./plugins/jwt.js";
import authPlugin from "./plugins/auth.js";
import authRoutes from "./modules/auth/auth.routes.js";
import workspaceRoutes from "./modules/workspaces/workspace.routes.js";
import serviceRoutes from "./modules/services/service.routes.js";
import endpointRoutes from "./modules/endpoints/endpoint.routes.js";
import type { FastifyError } from "fastify";
import { AuthError, AppError } from "./common/errors.js";
import { ErrorCode } from "@repo/shared-types/errors";

const server = fastify();

server.register(dbPlugin);
server.register(cookiePlugin);
server.register(jwtPlugin);
server.register(authPlugin);

server.register(authRoutes, { prefix: "/auth" });
server.register(workspaceRoutes, { prefix: "/workspaces" });
server.register(serviceRoutes, { prefix: "/workspaces/:workspaceId/services" });
server.register(endpointRoutes, { prefix: "/workspaces/:workspaceId/services/:serviceId/endpoints" });

server.get("/ping", async () => {
  return { pong: true };
});

server.setErrorHandler(function (error: FastifyError | AuthError | AppError, request, reply) {
  if (error instanceof AppError) {
    reply.code(error.statusCode).send({
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    });
    return;
  }

  if (error instanceof AuthError) {
    const statusMap: Record<string, number> = {
      [ErrorCode.EMAIL_TAKEN]: 409,
      [ErrorCode.INVALID_CREDENTIALS]: 401,
      [ErrorCode.UNAUTHORIZED]: 401,
      [ErrorCode.USER_NOT_FOUND]: 404,
      [ErrorCode.NOT_FOUND]: 404,
    };

    const statusCode = statusMap[error.code] ?? 400;

    reply.code(statusCode).send({
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    });
    return;
  }

  if ("validation" in error && error.validation) {
    reply.code(400).send({
      success: false,
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: error.message,
      },
    });
    return;
  }

  request.log.error(error);
  reply.code(500).send({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
    },
  });
});

server.listen({ port: 3001, host: "0.0.0.0" }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});

import type { FastifyInstance } from "fastify";
import { createWorkspaceRepository } from "../workspaces/workspace.repository.js";
import { createServiceRepository } from "./service.repository.js";
import { createServiceService } from "./service.service.js";
import {
  CreateServiceBodySchema,
  UpdateServiceBodySchema,
  ServiceParamsSchema,
  WorkspaceParamsSchema,
  type CreateServiceBody,
  type UpdateServiceBody,
  type ServiceParams,
  type WorkspaceParams,
} from "./service.schema.js";

export default async function serviceRoutes(fastify: FastifyInstance) {
  const workspaceRepository = createWorkspaceRepository(fastify.db);
  const repository = createServiceRepository(fastify.db);
  const service = createServiceService({ repository, workspaceRepository });

  fastify.addHook("preHandler", fastify.authenticate);

  fastify.post<{ Params: WorkspaceParams; Body: CreateServiceBody }>(
    "/",
    {
      schema: {
        params: WorkspaceParamsSchema,
        body: CreateServiceBodySchema,
      },
    },
    async (request, reply) => {
      const created = await service.create(
        request.params.workspaceId,
        request.user.sub,
        request.body,
      );
      reply.code(201).send({ success: true, data: created });
    },
  );

  fastify.get<{ Params: WorkspaceParams }>(
    "/",
    { schema: { params: WorkspaceParamsSchema } },
    async (request) => {
      const list = await service.list(
        request.params.workspaceId,
        request.user.sub,
      );
      return { success: true, data: list };
    },
  );

  fastify.get<{ Params: ServiceParams }>(
    "/:id",
    { schema: { params: ServiceParamsSchema } },
    async (request) => {
      const found = await service.getById(
        request.params.id,
        request.params.workspaceId,
        request.user.sub,
      );
      return { success: true, data: found };
    },
  );

  fastify.patch<{ Params: ServiceParams; Body: UpdateServiceBody }>(
    "/:id",
    {
      schema: {
        params: ServiceParamsSchema,
        body: UpdateServiceBodySchema,
      },
    },
    async (request) => {
      const updated = await service.update(
        request.params.id,
        request.params.workspaceId,
        request.user.sub,
        request.body,
      );
      return { success: true, data: updated };
    },
  );

  fastify.delete<{ Params: ServiceParams }>(
    "/:id",
    { schema: { params: ServiceParamsSchema } },
    async (request) => {
      await service.remove(
        request.params.id,
        request.params.workspaceId,
        request.user.sub,
      );
      return { success: true, data: null };
    },
  );
}

import type { FastifyInstance } from "fastify";
import { createWorkspaceRepository } from "./workspace.repository.js";
import { createWorkspaceService } from "./workspace.service.js";
import {
  CreateWorkspaceBodySchema,
  UpdateWorkspaceBodySchema,
  WorkspaceParamsSchema,
  type CreateWorkspaceBody,
  type UpdateWorkspaceBody,
  type WorkspaceParams,
} from "./workspace.schema.js";

export default async function workspaceRoutes(fastify: FastifyInstance) {
  const repository = createWorkspaceRepository(fastify.db);
  const service = createWorkspaceService(repository);

  fastify.addHook("preHandler", fastify.authenticate);

  fastify.post<{ Body: CreateWorkspaceBody }>(
    "/",
    { schema: { body: CreateWorkspaceBodySchema } },
    async (request, reply) => {
      const workspace = await service.create(request.user.sub, request.body);
      reply.code(201).send({ success: true, data: workspace });
    },
  );

  fastify.get("/", async (request) => {
    const workspaces = await service.list(request.user.sub);
    return { success: true, data: workspaces };
  });

  fastify.get<{ Params: WorkspaceParams }>(
    "/:id",
    { schema: { params: WorkspaceParamsSchema } },
    async (request) => {
      const workspace = await service.getById(
        request.params.id,
        request.user.sub,
      );
      return { success: true, data: workspace };
    },
  );

  fastify.patch<{ Params: WorkspaceParams; Body: UpdateWorkspaceBody }>(
    "/:id",
    {
      schema: {
        params: WorkspaceParamsSchema,
        body: UpdateWorkspaceBodySchema,
      },
    },
    async (request) => {
      const workspace = await service.update(
        request.params.id,
        request.user.sub,
        request.body,
      );
      return { success: true, data: workspace };
    },
  );

  fastify.delete<{ Params: WorkspaceParams }>(
    "/:id",
    { schema: { params: WorkspaceParamsSchema } },
    async (request) => {
      await service.remove(request.params.id, request.user.sub);
      return { success: true, data: null };
    },
  );
}

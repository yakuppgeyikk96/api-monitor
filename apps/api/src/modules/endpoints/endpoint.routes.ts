import type { FastifyInstance } from "fastify";
import { createWorkspaceRepository } from "../workspaces/workspace.repository.js";
import { createServiceRepository } from "../services/service.repository.js";
import { createEndpointRepository } from "./endpoint.repository.js";
import { createEndpointService } from "./endpoint.service.js";
import {
  CreateEndpointBodySchema,
  UpdateEndpointBodySchema,
  ServiceEndpointParamsSchema,
  EndpointParamsSchema,
  type CreateEndpointBody,
  type UpdateEndpointBody,
  type ServiceEndpointParams,
  type EndpointParams,
} from "./endpoint.schema.js";

export default async function endpointRoutes(fastify: FastifyInstance) {
  const workspaceRepository = createWorkspaceRepository(fastify.db);
  const serviceRepository = createServiceRepository(fastify.db);
  const repository = createEndpointRepository(fastify.db);
  const service = createEndpointService({
    repository,
    serviceRepository,
    workspaceRepository,
  });

  fastify.addHook("preHandler", fastify.authenticate);

  fastify.post<{ Params: ServiceEndpointParams; Body: CreateEndpointBody }>(
    "/",
    {
      schema: {
        params: ServiceEndpointParamsSchema,
        body: CreateEndpointBodySchema,
      },
    },
    async (request, reply) => {
      const created = await service.create(
        request.params.workspaceId,
        request.params.serviceId,
        request.user.sub,
        request.body,
      );
      reply.code(201).send({ success: true, data: created });
    },
  );

  fastify.get<{ Params: ServiceEndpointParams }>(
    "/",
    { schema: { params: ServiceEndpointParamsSchema } },
    async (request) => {
      const list = await service.list(
        request.params.workspaceId,
        request.params.serviceId,
        request.user.sub,
      );
      return { success: true, data: list };
    },
  );

  fastify.get<{ Params: EndpointParams }>(
    "/:id",
    { schema: { params: EndpointParamsSchema } },
    async (request) => {
      const found = await service.getById(
        request.params.id,
        request.params.serviceId,
        request.params.workspaceId,
        request.user.sub,
      );
      return { success: true, data: found };
    },
  );

  fastify.patch<{ Params: EndpointParams; Body: UpdateEndpointBody }>(
    "/:id",
    {
      schema: {
        params: EndpointParamsSchema,
        body: UpdateEndpointBodySchema,
      },
    },
    async (request) => {
      const updated = await service.update(
        request.params.id,
        request.params.serviceId,
        request.params.workspaceId,
        request.user.sub,
        request.body,
      );
      return { success: true, data: updated };
    },
  );

  fastify.delete<{ Params: EndpointParams }>(
    "/:id",
    { schema: { params: EndpointParamsSchema } },
    async (request) => {
      await service.remove(
        request.params.id,
        request.params.serviceId,
        request.params.workspaceId,
        request.user.sub,
      );
      return { success: true, data: null };
    },
  );
}

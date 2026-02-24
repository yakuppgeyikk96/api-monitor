import { ErrorCode, ErrorMessage } from "@repo/shared-types/errors";
import { AppError } from "../../common/errors.js";
import type { EndpointRepository } from "./endpoint.repository.js";
import type { ServiceRepository } from "../services/service.repository.js";
import type { WorkspaceRepository } from "../workspaces/workspace.repository.js";
import type {
  CreateEndpointBody,
  UpdateEndpointBody,
} from "./endpoint.schema.js";

interface EndpointServiceDeps {
  repository: EndpointRepository;
  serviceRepository: ServiceRepository;
  workspaceRepository: WorkspaceRepository;
}

export function createEndpointService({
  repository,
  serviceRepository,
  workspaceRepository,
}: EndpointServiceDeps) {
  async function assertWorkspaceOwner(workspaceId: number, userId: number) {
    const workspace = await workspaceRepository.findById(workspaceId);
    if (!workspace) {
      throw new AppError(
        ErrorCode.WORKSPACE_NOT_FOUND,
        ErrorMessage.WORKSPACE_NOT_FOUND,
        404,
      );
    }
    if (workspace.ownerId !== userId) {
      throw new AppError(ErrorCode.FORBIDDEN, ErrorMessage.FORBIDDEN, 403);
    }
    return workspace;
  }

  async function assertServiceExists(serviceId: number, workspaceId: number) {
    const service = await serviceRepository.findById(serviceId, workspaceId);
    if (!service) {
      throw new AppError(
        ErrorCode.SERVICE_NOT_FOUND,
        ErrorMessage.SERVICE_NOT_FOUND,
        404,
      );
    }
    return service;
  }

  async function assertEndpointExists(id: number, serviceId: number) {
    const endpoint = await repository.findById(id, serviceId);
    if (!endpoint) {
      throw new AppError(
        ErrorCode.ENDPOINT_NOT_FOUND,
        ErrorMessage.ENDPOINT_NOT_FOUND,
        404,
      );
    }
    return endpoint;
  }

  return {
    async create(
      workspaceId: number,
      serviceId: number,
      userId: number,
      input: CreateEndpointBody,
    ) {
      await assertWorkspaceOwner(workspaceId, userId);
      await assertServiceExists(serviceId, workspaceId);
      return repository.create({
        workspaceId,
        serviceId,
        name: input.name,
        route: input.route,
        httpMethod: input.httpMethod,
        expectedStatusCode: input.expectedStatusCode ?? 200,
        checkIntervalSeconds: input.checkIntervalSeconds ?? 300,
        headers: input.headers ?? null,
        body: input.body ?? null,
        expectedBody: input.expectedBody ?? null,
        isActive: input.isActive ?? true,
      });
    },

    async list(workspaceId: number, serviceId: number, userId: number) {
      await assertWorkspaceOwner(workspaceId, userId);
      await assertServiceExists(serviceId, workspaceId);
      return repository.findAllByServiceId(serviceId);
    },

    async getById(
      id: number,
      serviceId: number,
      workspaceId: number,
      userId: number,
    ) {
      await assertWorkspaceOwner(workspaceId, userId);
      await assertServiceExists(serviceId, workspaceId);
      return assertEndpointExists(id, serviceId);
    },

    async update(
      id: number,
      serviceId: number,
      workspaceId: number,
      userId: number,
      input: UpdateEndpointBody,
    ) {
      await assertWorkspaceOwner(workspaceId, userId);
      await assertServiceExists(serviceId, workspaceId);
      await assertEndpointExists(id, serviceId);
      return repository.update(id, serviceId, input);
    },

    async remove(
      id: number,
      serviceId: number,
      workspaceId: number,
      userId: number,
    ) {
      await assertWorkspaceOwner(workspaceId, userId);
      await assertServiceExists(serviceId, workspaceId);
      await assertEndpointExists(id, serviceId);
      await repository.softDeleteCascade(id, serviceId);
    },
  };
}

export type EndpointService = ReturnType<typeof createEndpointService>;

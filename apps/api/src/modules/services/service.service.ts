import { ErrorCode, ErrorMessage } from "@repo/shared-types/errors";
import { AppError } from "../../common/errors.js";
import type { ServiceRepository } from "./service.repository.js";
import type { WorkspaceRepository } from "../workspaces/workspace.repository.js";
import type {
  CreateServiceBody,
  UpdateServiceBody,
} from "./service.schema.js";

interface ServiceServiceDeps {
  repository: ServiceRepository;
  workspaceRepository: WorkspaceRepository;
}

export function createServiceService({
  repository,
  workspaceRepository,
}: ServiceServiceDeps) {
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

  async function assertServiceExists(id: number, workspaceId: number) {
    const service = await repository.findById(id, workspaceId);
    if (!service) {
      throw new AppError(
        ErrorCode.SERVICE_NOT_FOUND,
        ErrorMessage.SERVICE_NOT_FOUND,
        404,
      );
    }
    return service;
  }

  return {
    async create(
      workspaceId: number,
      userId: number,
      input: CreateServiceBody,
    ) {
      await assertWorkspaceOwner(workspaceId, userId);
      return repository.create({
        workspaceId,
        name: input.name,
        baseUrl: input.baseUrl,
        defaultHeaders: input.defaultHeaders ?? null,
        defaultTimeoutSeconds: input.defaultTimeoutSeconds ?? 30,
      });
    },

    async list(workspaceId: number, userId: number) {
      await assertWorkspaceOwner(workspaceId, userId);
      return repository.findAllByWorkspaceId(workspaceId);
    },

    async getById(id: number, workspaceId: number, userId: number) {
      await assertWorkspaceOwner(workspaceId, userId);
      return assertServiceExists(id, workspaceId);
    },

    async update(
      id: number,
      workspaceId: number,
      userId: number,
      input: UpdateServiceBody,
    ) {
      await assertWorkspaceOwner(workspaceId, userId);
      await assertServiceExists(id, workspaceId);
      return repository.update(id, workspaceId, input);
    },

    async remove(id: number, workspaceId: number, userId: number) {
      await assertWorkspaceOwner(workspaceId, userId);
      await assertServiceExists(id, workspaceId);
      await repository.softDeleteCascade(id, workspaceId);
    },
  };
}

export type ServiceService = ReturnType<typeof createServiceService>;

import { ErrorCode, ErrorMessage } from "@repo/shared-types/errors";
import { AppError } from "../../common/errors.js";
import { generateSlug } from "../../common/slug.js";
import type { WorkspaceRepository } from "./workspace.repository.js";
import type { CreateWorkspaceBody, UpdateWorkspaceBody } from "./workspace.schema.js";

export function createWorkspaceService(repository: WorkspaceRepository) {
  async function assertOwner(workspaceId: number, userId: number) {
    const workspace = await repository.findById(workspaceId);
    if (!workspace) {
      throw new AppError(
        ErrorCode.WORKSPACE_NOT_FOUND,
        ErrorMessage.WORKSPACE_NOT_FOUND,
        404,
      );
    }
    if (workspace.ownerId !== userId) {
      throw new AppError(
        ErrorCode.FORBIDDEN,
        ErrorMessage.FORBIDDEN,
        403,
      );
    }
    return workspace;
  }

  async function assertSlugAvailable(slug: string, excludeId?: number) {
    const existing = await repository.findBySlug(slug);
    if (existing && existing.id !== excludeId) {
      throw new AppError(
        ErrorCode.SLUG_TAKEN,
        ErrorMessage.SLUG_TAKEN,
        409,
      );
    }
  }

  return {
    async create(ownerId: number, input: CreateWorkspaceBody) {
      const slug = input.slug ?? generateSlug(input.name);
      await assertSlugAvailable(slug);
      return repository.create({ ownerId, name: input.name, slug });
    },

    async list(ownerId: number) {
      return repository.findAllByOwnerId(ownerId);
    },

    async getById(id: number, userId: number) {
      return assertOwner(id, userId);
    },

    async update(id: number, userId: number, input: UpdateWorkspaceBody) {
      await assertOwner(id, userId);

      if (input.slug) {
        await assertSlugAvailable(input.slug, id);
      }

      return repository.update(id, input);
    },

    async remove(id: number, userId: number) {
      await assertOwner(id, userId);
      await repository.softDelete(id);
    },
  };
}

export type WorkspaceService = ReturnType<typeof createWorkspaceService>;

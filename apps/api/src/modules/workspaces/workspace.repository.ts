import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import {
  workspaces,
  type Workspace,
  type NewWorkspace,
} from "../../db/schema/workspace.js";
import { services } from "../../db/schema/service.js";
import { endpoints } from "../../db/schema/endpoint.js";
import { withActive } from "../../db/helpers.js";

export function createWorkspaceRepository(db: PostgresJsDatabase) {
  return {
    async create(data: NewWorkspace): Promise<Workspace> {
      const [workspace] = await db
        .insert(workspaces)
        .values(data)
        .returning();
      return workspace;
    },

    async findById(id: number): Promise<Workspace | null> {
      const [workspace] = await db
        .select()
        .from(workspaces)
        .where(withActive(workspaces, eq(workspaces.id, id)));
      return workspace ?? null;
    },

    async findBySlug(slug: string): Promise<Workspace | null> {
      const [workspace] = await db
        .select()
        .from(workspaces)
        .where(withActive(workspaces, eq(workspaces.slug, slug)));
      return workspace ?? null;
    },

    async findAllByOwnerId(ownerId: number): Promise<Workspace[]> {
      return db
        .select()
        .from(workspaces)
        .where(withActive(workspaces, eq(workspaces.ownerId, ownerId)));
    },

    async update(
      id: number,
      data: Partial<Pick<Workspace, "name" | "slug">>,
    ): Promise<Workspace | null> {
      const [workspace] = await db
        .update(workspaces)
        .set(data)
        .where(withActive(workspaces, eq(workspaces.id, id)))
        .returning();
      return workspace ?? null;
    },

    async softDeleteCascade(id: number): Promise<void> {
      const now = new Date();
      await db.transaction(async (tx) => {
        await tx
          .update(endpoints)
          .set({ deletedAt: now })
          .where(withActive(endpoints, eq(endpoints.workspaceId, id)));
        await tx
          .update(services)
          .set({ deletedAt: now })
          .where(withActive(services, eq(services.workspaceId, id)));
        await tx
          .update(workspaces)
          .set({ deletedAt: now })
          .where(withActive(workspaces, eq(workspaces.id, id)));
      });
    },
  };
}

export type WorkspaceRepository = ReturnType<typeof createWorkspaceRepository>;

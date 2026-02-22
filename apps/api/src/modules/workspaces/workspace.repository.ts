import { eq, and, isNull } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import {
  workspaces,
  type Workspace,
  type NewWorkspace,
} from "../../db/schema/workspace.js";

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
        .where(and(eq(workspaces.id, id), isNull(workspaces.deletedAt)));
      return workspace ?? null;
    },

    async findBySlug(slug: string): Promise<Workspace | null> {
      const [workspace] = await db
        .select()
        .from(workspaces)
        .where(and(eq(workspaces.slug, slug), isNull(workspaces.deletedAt)));
      return workspace ?? null;
    },

    async findAllByOwnerId(ownerId: number): Promise<Workspace[]> {
      return db
        .select()
        .from(workspaces)
        .where(
          and(eq(workspaces.ownerId, ownerId), isNull(workspaces.deletedAt)),
        );
    },

    async update(
      id: number,
      data: Partial<Pick<Workspace, "name" | "slug">>,
    ): Promise<Workspace | null> {
      const [workspace] = await db
        .update(workspaces)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(workspaces.id, id), isNull(workspaces.deletedAt)))
        .returning();
      return workspace ?? null;
    },

    async softDelete(id: number): Promise<void> {
      await db
        .update(workspaces)
        .set({ deletedAt: new Date() })
        .where(eq(workspaces.id, id));
    },
  };
}

export type WorkspaceRepository = ReturnType<typeof createWorkspaceRepository>;

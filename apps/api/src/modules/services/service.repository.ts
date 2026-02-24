import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import {
  services,
  type Service,
  type NewService,
} from "../../db/schema/service.js";
import { endpoints } from "../../db/schema/endpoint.js";
import { withActive } from "../../db/helpers.js";

export function createServiceRepository(db: PostgresJsDatabase) {
  return {
    async create(data: NewService): Promise<Service> {
      const [service] = await db.insert(services).values(data).returning();
      return service;
    },

    async findById(id: number, workspaceId: number): Promise<Service | null> {
      const [service] = await db
        .select()
        .from(services)
        .where(
          withActive(services, eq(services.id, id), eq(services.workspaceId, workspaceId)),
        );
      return service ?? null;
    },

    async findAllByWorkspaceId(workspaceId: number): Promise<Service[]> {
      return db
        .select()
        .from(services)
        .where(withActive(services, eq(services.workspaceId, workspaceId)));
    },

    async update(
      id: number,
      workspaceId: number,
      data: Partial<
        Pick<
          Service,
          "name" | "baseUrl" | "defaultHeaders" | "defaultTimeoutSeconds"
        >
      >,
    ): Promise<Service | null> {
      const [service] = await db
        .update(services)
        .set(data)
        .where(
          withActive(services, eq(services.id, id), eq(services.workspaceId, workspaceId)),
        )
        .returning();
      return service ?? null;
    },

    async softDeleteCascade(id: number, workspaceId: number): Promise<void> {
      const now = new Date();
      await db.transaction(async (tx) => {
        await tx
          .update(endpoints)
          .set({ deletedAt: now })
          .where(withActive(endpoints, eq(endpoints.serviceId, id)));
        await tx
          .update(services)
          .set({ deletedAt: now })
          .where(
            withActive(services, eq(services.id, id), eq(services.workspaceId, workspaceId)),
          );
      });
    },
  };
}

export type ServiceRepository = ReturnType<typeof createServiceRepository>;

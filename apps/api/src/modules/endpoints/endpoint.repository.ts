import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import {
  endpoints,
  type Endpoint,
  type NewEndpoint,
} from "../../db/schema/endpoint.js";
import { withActive } from "../../db/helpers.js";

export function createEndpointRepository(db: PostgresJsDatabase) {
  return {
    async create(data: NewEndpoint): Promise<Endpoint> {
      const [endpoint] = await db.insert(endpoints).values(data).returning();
      return endpoint;
    },

    async findById(id: number, serviceId: number): Promise<Endpoint | null> {
      const [endpoint] = await db
        .select()
        .from(endpoints)
        .where(
          withActive(endpoints, eq(endpoints.id, id), eq(endpoints.serviceId, serviceId)),
        );
      return endpoint ?? null;
    },

    async findAllByServiceId(serviceId: number): Promise<Endpoint[]> {
      return db
        .select()
        .from(endpoints)
        .where(withActive(endpoints, eq(endpoints.serviceId, serviceId)));
    },

    async update(
      id: number,
      serviceId: number,
      data: Partial<
        Pick<
          Endpoint,
          | "name"
          | "route"
          | "httpMethod"
          | "headers"
          | "body"
          | "expectedStatusCode"
          | "expectedBody"
          | "checkIntervalSeconds"
          | "isActive"
        >
      >,
    ): Promise<Endpoint | null> {
      const [endpoint] = await db
        .update(endpoints)
        .set(data)
        .where(
          withActive(endpoints, eq(endpoints.id, id), eq(endpoints.serviceId, serviceId)),
        )
        .returning();
      return endpoint ?? null;
    },

    async softDeleteCascade(id: number, serviceId: number): Promise<void> {
      await db
        .update(endpoints)
        .set({ deletedAt: new Date() })
        .where(
          withActive(endpoints, eq(endpoints.id, id), eq(endpoints.serviceId, serviceId)),
        );
    },
  };
}

export type EndpointRepository = ReturnType<typeof createEndpointRepository>;

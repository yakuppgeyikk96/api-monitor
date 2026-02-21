import {
  boolean,
  integer,
  jsonb,
  pgTable,
  varchar,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { timestamps } from "./_columns";
import { workspaces } from "./workspace";
import { services } from "./service";

export const endpoints = pgTable(
  "endpoints",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    workspaceId: integer("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    serviceId: integer("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    route: varchar("route", { length: 2048 }).notNull(),
    httpMethod: varchar("http_method", { length: 10 }).notNull().default("GET"),
    headers: jsonb("headers"),
    body: jsonb("body"),
    expectedStatusCode: integer("expected_status_code").notNull().default(200),
    expectedBody: jsonb("expected_body"),
    checkIntervalSeconds: integer("check_interval_seconds")
      .notNull()
      .default(300),
    isActive: boolean("is_active").notNull().default(true),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("endpoints_workspace_id_idx").on(table.workspaceId),
    index("endpoints_service_id_idx").on(table.serviceId),
    index("endpoints_deleted_at_idx").on(table.deletedAt),
    index("endpoints_active_check_idx").on(table.isActive, table.deletedAt),
  ]
);

export type Endpoint = typeof endpoints.$inferSelect;
export type NewEndpoint = typeof endpoints.$inferInsert;

import {
  integer,
  jsonb,
  pgTable,
  varchar,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { timestamps } from "./_columns";
import { workspaces } from "./workspace";

export const services = pgTable(
  "services",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    workspaceId: integer("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    baseUrl: varchar("base_url", { length: 2048 }).notNull(),
    defaultHeaders: jsonb("default_headers"),
    defaultTimeoutSeconds: integer("default_timeout_seconds")
      .notNull()
      .default(30),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("services_workspace_id_idx").on(table.workspaceId),
    index("services_deleted_at_idx").on(table.deletedAt),
  ]
);

export type Service = typeof services.$inferSelect;
export type NewService = typeof services.$inferInsert;

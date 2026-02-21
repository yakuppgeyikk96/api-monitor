import {
  integer,
  pgTable,
  varchar,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { timestamps } from "./_columns";
import { users } from "./user";

export const workspaces = pgTable(
  "workspaces",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    ownerId: integer("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    slug: varchar("slug", { length: 60 }).notNull().unique(),
    plan: varchar("plan", { length: 20 }).notNull().default("free"),
    maxServices: integer("max_services").notNull().default(5),
    maxCheckIntervalSeconds: integer("max_check_interval_seconds")
      .notNull()
      .default(300),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("workspaces_owner_id_idx").on(table.ownerId),
    index("workspaces_deleted_at_idx").on(table.deletedAt),
  ]
);

export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;

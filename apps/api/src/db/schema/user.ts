import {
  integer,
  pgTable,
  varchar,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { timestamps } from "./_columns";

export const users = pgTable(
  "users",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    fullName: varchar("full_name", { length: 100 }).notNull(),
    avatarUrl: varchar("avatar_url", { length: 2048 }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("users_deleted_at_idx").on(table.deletedAt),
  ]
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

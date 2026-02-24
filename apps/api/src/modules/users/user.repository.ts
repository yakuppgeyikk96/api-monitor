import { eq, getTableColumns } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { users, type User, type NewUser } from "../../db/schema/user.js";
import { withActive } from "../../db/helpers.js";

const { passwordHash: _passwordHash, deletedAt: _deletedAt, ...publicColumns } =
  getTableColumns(users);

export type UserPublic = Omit<User, "passwordHash" | "deletedAt">;

export function createUserRepository(db: PostgresJsDatabase) {
  return {
    async create(data: NewUser): Promise<UserPublic> {
      const [user] = await db.insert(users).values(data).returning(publicColumns);
      return user;
    },

    async findById(id: number): Promise<UserPublic | null> {
      const [user] = await db
        .select(publicColumns)
        .from(users)
        .where(withActive(users, eq(users.id, id)));

      return user ?? null;
    },

    async findByEmail(email: string): Promise<UserPublic | null> {
      const [user] = await db
        .select(publicColumns)
        .from(users)
        .where(withActive(users, eq(users.email, email)));

      return user ?? null;
    },

    async findByEmailWithPassword(email: string): Promise<User | null> {
      const [user] = await db
        .select()
        .from(users)
        .where(withActive(users, eq(users.email, email)));

      return user ?? null;
    },

  };
}

export type UserRepository = ReturnType<typeof createUserRepository>;

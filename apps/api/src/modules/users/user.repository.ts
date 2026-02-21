import { eq, and, isNull } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { users, type User, type NewUser } from "../../db/schema/user.js";

export function createUserRepository(db: PostgresJsDatabase) {
  return {
    async create(data: NewUser): Promise<User> {
      const [user] = await db.insert(users).values(data).returning();
      return user;
    },

    async findById(id: number): Promise<User | null> {
      const [user] = await db
        .select()
        .from(users)
        .where(and(eq(users.id, id), isNull(users.deletedAt)));

      return user ?? null;
    },

    async findByEmail(email: string): Promise<User | null> {
      const [user] = await db
        .select()
        .from(users)
        .where(and(eq(users.email, email), isNull(users.deletedAt)));

      return user ?? null;
    },

    async updatePassword(
      id: number,
      passwordHash: string,
    ): Promise<User | null> {
      const [user] = await db
        .update(users)
        .set({ passwordHash, updatedAt: new Date() })
        .where(and(eq(users.id, id), isNull(users.deletedAt)))
        .returning();

      return user ?? null;
    },
  };
}

export type UserRepository = ReturnType<typeof createUserRepository>;

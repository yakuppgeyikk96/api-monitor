import fp from "fastify-plugin";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import type { FastifyInstance } from "fastify";

async function dbPlugin(fastify: FastifyInstance) {
  const client = postgres(process.env.DATABASE_URL!);
  const db = drizzle(client);

  fastify.decorate("db", db);

  fastify.addHook("onClose", async () => {
    await client.end();
  });
}

export default fp(dbPlugin, { name: "db" });

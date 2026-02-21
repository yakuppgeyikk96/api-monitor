import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { FastifyRequest, FastifyReply } from "fastify";
import type { JwtPayload } from "../common/jwt.js";

declare module "fastify" {
  interface FastifyInstance {
    db: PostgresJsDatabase;
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}

import { Type, type Static } from "@sinclair/typebox";

export const WorkspaceParamsSchema = Type.Object({
  workspaceId: Type.Number(),
});
export type WorkspaceParams = Static<typeof WorkspaceParamsSchema>;

export const ServiceParamsSchema = Type.Object({
  workspaceId: Type.Number(),
  id: Type.Number(),
});
export type ServiceParams = Static<typeof ServiceParamsSchema>;

export const CreateServiceBodySchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 100 }),
  baseUrl: Type.String({ minLength: 1, maxLength: 2048 }),
  defaultHeaders: Type.Optional(
    Type.Record(Type.String(), Type.String()),
  ),
  defaultTimeoutSeconds: Type.Optional(
    Type.Integer({ minimum: 1, maximum: 300 }),
  ),
});
export type CreateServiceBody = Static<typeof CreateServiceBodySchema>;

export const UpdateServiceBodySchema = Type.Object({
  name: Type.Optional(Type.String({ minLength: 1, maxLength: 100 })),
  baseUrl: Type.Optional(Type.String({ minLength: 1, maxLength: 2048 })),
  defaultHeaders: Type.Optional(
    Type.Union([Type.Record(Type.String(), Type.String()), Type.Null()]),
  ),
  defaultTimeoutSeconds: Type.Optional(
    Type.Integer({ minimum: 1, maximum: 300 }),
  ),
});
export type UpdateServiceBody = Static<typeof UpdateServiceBodySchema>;

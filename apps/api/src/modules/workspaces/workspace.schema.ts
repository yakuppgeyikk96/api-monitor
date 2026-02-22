import { Type, type Static } from "@sinclair/typebox";

export const CreateWorkspaceBodySchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 100 }),
  slug: Type.Optional(Type.String({ minLength: 1, maxLength: 60 })),
});

export type CreateWorkspaceBody = Static<typeof CreateWorkspaceBodySchema>;

export const UpdateWorkspaceBodySchema = Type.Object({
  name: Type.Optional(Type.String({ minLength: 1, maxLength: 100 })),
  slug: Type.Optional(Type.String({ minLength: 1, maxLength: 60 })),
});

export type UpdateWorkspaceBody = Static<typeof UpdateWorkspaceBodySchema>;

export const WorkspaceParamsSchema = Type.Object({
  id: Type.Number(),
});

export type WorkspaceParams = Static<typeof WorkspaceParamsSchema>;

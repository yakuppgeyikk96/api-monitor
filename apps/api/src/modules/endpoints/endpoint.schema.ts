import { Type, type Static } from "@sinclair/typebox";

export const ServiceEndpointParamsSchema = Type.Object({
  workspaceId: Type.Number(),
  serviceId: Type.Number(),
});
export type ServiceEndpointParams = Static<typeof ServiceEndpointParamsSchema>;

export const EndpointParamsSchema = Type.Object({
  workspaceId: Type.Number(),
  serviceId: Type.Number(),
  id: Type.Number(),
});
export type EndpointParams = Static<typeof EndpointParamsSchema>;

export const CreateEndpointBodySchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 100 }),
  route: Type.String({ minLength: 1, maxLength: 2048 }),
  httpMethod: Type.String({ minLength: 1, maxLength: 10 }),
  expectedStatusCode: Type.Optional(Type.Integer({ minimum: 100, maximum: 599 })),
  checkIntervalSeconds: Type.Optional(Type.Integer({ minimum: 10, maximum: 86400 })),
  headers: Type.Optional(Type.Record(Type.String(), Type.String())),
  body: Type.Optional(Type.Unknown()),
  expectedBody: Type.Optional(Type.Unknown()),
  isActive: Type.Optional(Type.Boolean()),
});
export type CreateEndpointBody = Static<typeof CreateEndpointBodySchema>;

export const UpdateEndpointBodySchema = Type.Object({
  name: Type.Optional(Type.String({ minLength: 1, maxLength: 100 })),
  route: Type.Optional(Type.String({ minLength: 1, maxLength: 2048 })),
  httpMethod: Type.Optional(Type.String({ minLength: 1, maxLength: 10 })),
  expectedStatusCode: Type.Optional(Type.Integer({ minimum: 100, maximum: 599 })),
  checkIntervalSeconds: Type.Optional(Type.Integer({ minimum: 10, maximum: 86400 })),
  headers: Type.Optional(
    Type.Union([Type.Record(Type.String(), Type.String()), Type.Null()]),
  ),
  body: Type.Optional(Type.Union([Type.Unknown(), Type.Null()])),
  expectedBody: Type.Optional(Type.Union([Type.Unknown(), Type.Null()])),
  isActive: Type.Optional(Type.Boolean()),
});
export type UpdateEndpointBody = Static<typeof UpdateEndpointBodySchema>;

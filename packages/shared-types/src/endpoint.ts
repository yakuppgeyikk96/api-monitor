export interface Endpoint {
  id: number;
  workspaceId: number;
  serviceId: number;
  name: string;
  route: string;
  httpMethod: string;
  headers: Record<string, string> | null;
  body: unknown;
  expectedStatusCode: number;
  expectedBody: unknown;
  checkIntervalSeconds: number;
  isActive: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEndpointInput {
  name: string;
  route: string;
  httpMethod: string;
  expectedStatusCode?: number;
  checkIntervalSeconds?: number;
  headers?: Record<string, string>;
  body?: unknown;
  expectedBody?: unknown;
  isActive?: boolean;
}

export interface UpdateEndpointInput {
  name?: string;
  route?: string;
  httpMethod?: string;
  expectedStatusCode?: number;
  checkIntervalSeconds?: number;
  headers?: Record<string, string> | null;
  body?: unknown;
  expectedBody?: unknown;
  isActive?: boolean;
}

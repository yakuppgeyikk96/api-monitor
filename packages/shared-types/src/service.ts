export interface Service {
  id: number;
  workspaceId: number;
  name: string;
  baseUrl: string;
  defaultHeaders: Record<string, string> | null;
  defaultTimeoutSeconds: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServiceInput {
  name: string;
  baseUrl: string;
  defaultHeaders?: Record<string, string>;
  defaultTimeoutSeconds?: number;
}

export interface UpdateServiceInput {
  name?: string;
  baseUrl?: string;
  defaultHeaders?: Record<string, string> | null;
  defaultTimeoutSeconds?: number;
}

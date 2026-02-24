export interface Workspace {
  id: number;
  ownerId: number;
  name: string;
  slug: string;
  plan: string;
  maxServices: number;
  maxCheckIntervalSeconds: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkspaceInput {
  name: string;
  slug?: string;
}

export interface UpdateWorkspaceInput {
  name?: string;
  slug?: string;
}

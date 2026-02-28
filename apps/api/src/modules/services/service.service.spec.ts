import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { ErrorCode } from '@repo/shared-types/errors';
import type { ServiceRepository } from './service.repository.js';
import type { WorkspaceRepository } from '../workspaces/workspace.repository.js';
import { createServiceService } from './service.service.js';

type MockedRepository<T> = { [K in keyof T]: Mock<Extract<T[K], (...args: any[]) => any>> };

const mockWorkspace = {
  id: 1,
  name: 'My Workspace',
  slug: 'my-workspace',
  ownerId: 10,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockService = {
  id: 1,
  workspaceId: 1,
  name: 'Payment API',
  baseUrl: 'https://api.payment.com',
  defaultHeaders: null,
  defaultTimeoutSeconds: 30,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function createMockServiceRepository(): MockedRepository<ServiceRepository> {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findAllByWorkspaceId: vi.fn(),
    update: vi.fn(),
    softDeleteCascade: vi.fn(),
  };
}

function createMockWorkspaceRepository(): Pick<MockedRepository<WorkspaceRepository>, 'findById'> {
  return {
    findById: vi.fn(),
  };
}

describe('ServiceService', () => {
  let serviceRepo: MockedRepository<ServiceRepository>;
  let workspaceRepo: ReturnType<typeof createMockWorkspaceRepository>;
  let service: ReturnType<typeof createServiceService>;

  beforeEach(() => {
    vi.clearAllMocks();
    serviceRepo = createMockServiceRepository();
    workspaceRepo = createMockWorkspaceRepository();
    service = createServiceService({
      repository: serviceRepo,
      workspaceRepository: workspaceRepo as unknown as WorkspaceRepository,
    });
  });

  describe('create', () => {
    const input = { name: 'Payment API', baseUrl: 'https://api.payment.com' };

    it('should create service with default values', async () => {
      workspaceRepo.findById.mockResolvedValue(mockWorkspace);
      serviceRepo.create.mockResolvedValue(mockService);

      const result = await service.create(1, 10, input);

      expect(serviceRepo.create).toHaveBeenCalledWith({
        workspaceId: 1,
        name: input.name,
        baseUrl: input.baseUrl,
        defaultHeaders: null,
        defaultTimeoutSeconds: 30,
      });
      expect(result).toEqual(mockService);
    });

    it('should use provided optional values', async () => {
      workspaceRepo.findById.mockResolvedValue(mockWorkspace);
      serviceRepo.create.mockResolvedValue(mockService);

      await service.create(1, 10, {
        ...input,
        defaultHeaders: { Authorization: 'Bearer xxx' },
        defaultTimeoutSeconds: 60,
      });

      expect(serviceRepo.create).toHaveBeenCalledWith({
        workspaceId: 1,
        name: input.name,
        baseUrl: input.baseUrl,
        defaultHeaders: { Authorization: 'Bearer xxx' },
        defaultTimeoutSeconds: 60,
      });
    });

    it('should throw WORKSPACE_NOT_FOUND if workspace does not exist', async () => {
      workspaceRepo.findById.mockResolvedValue(null);

      await expect(service.create(999, 10, input))
        .rejects.toMatchObject({ code: ErrorCode.WORKSPACE_NOT_FOUND, statusCode: 404 });
      expect(serviceRepo.create).not.toHaveBeenCalled();
    });

    it('should throw FORBIDDEN if user is not the workspace owner', async () => {
      workspaceRepo.findById.mockResolvedValue(mockWorkspace);

      await expect(service.create(1, 999, input))
        .rejects.toMatchObject({ code: ErrorCode.FORBIDDEN, statusCode: 403 });
      expect(serviceRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('list', () => {
    it('should return all services for the workspace', async () => {
      workspaceRepo.findById.mockResolvedValue(mockWorkspace);
      serviceRepo.findAllByWorkspaceId.mockResolvedValue([mockService]);

      const result = await service.list(1, 10);

      expect(serviceRepo.findAllByWorkspaceId).toHaveBeenCalledWith(1);
      expect(result).toEqual([mockService]);
    });

    it('should throw FORBIDDEN if user is not the workspace owner', async () => {
      workspaceRepo.findById.mockResolvedValue(mockWorkspace);

      await expect(service.list(1, 999))
        .rejects.toMatchObject({ code: ErrorCode.FORBIDDEN, statusCode: 403 });
    });
  });

  describe('getById', () => {
    it('should return service when it exists', async () => {
      workspaceRepo.findById.mockResolvedValue(mockWorkspace);
      serviceRepo.findById.mockResolvedValue(mockService);

      const result = await service.getById(1, 1, 10);

      expect(result).toEqual(mockService);
    });

    it('should throw SERVICE_NOT_FOUND if service does not exist', async () => {
      workspaceRepo.findById.mockResolvedValue(mockWorkspace);
      serviceRepo.findById.mockResolvedValue(null);

      await expect(service.getById(999, 1, 10))
        .rejects.toMatchObject({ code: ErrorCode.SERVICE_NOT_FOUND, statusCode: 404 });
    });
  });

  describe('update', () => {
    it('should update service when validations pass', async () => {
      const updated = { ...mockService, name: 'Updated API' };
      workspaceRepo.findById.mockResolvedValue(mockWorkspace);
      serviceRepo.findById.mockResolvedValue(mockService);
      serviceRepo.update.mockResolvedValue(updated);

      const result = await service.update(1, 1, 10, { name: 'Updated API' });

      expect(serviceRepo.update).toHaveBeenCalledWith(1, 1, { name: 'Updated API' });
      expect(result).toEqual(updated);
    });

    it('should throw SERVICE_NOT_FOUND if service does not exist', async () => {
      workspaceRepo.findById.mockResolvedValue(mockWorkspace);
      serviceRepo.findById.mockResolvedValue(null);

      await expect(service.update(999, 1, 10, { name: 'X' }))
        .rejects.toMatchObject({ code: ErrorCode.SERVICE_NOT_FOUND, statusCode: 404 });
      expect(serviceRepo.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should soft delete cascade when validations pass', async () => {
      workspaceRepo.findById.mockResolvedValue(mockWorkspace);
      serviceRepo.findById.mockResolvedValue(mockService);
      serviceRepo.softDeleteCascade.mockResolvedValue(undefined);

      await service.remove(1, 1, 10);

      expect(serviceRepo.softDeleteCascade).toHaveBeenCalledWith(1, 1);
    });

    it('should throw WORKSPACE_NOT_FOUND if workspace does not exist', async () => {
      workspaceRepo.findById.mockResolvedValue(null);

      await expect(service.remove(1, 999, 10))
        .rejects.toMatchObject({ code: ErrorCode.WORKSPACE_NOT_FOUND, statusCode: 404 });
      expect(serviceRepo.softDeleteCascade).not.toHaveBeenCalled();
    });

    it('should throw SERVICE_NOT_FOUND if service does not exist', async () => {
      workspaceRepo.findById.mockResolvedValue(mockWorkspace);
      serviceRepo.findById.mockResolvedValue(null);

      await expect(service.remove(999, 1, 10))
        .rejects.toMatchObject({ code: ErrorCode.SERVICE_NOT_FOUND, statusCode: 404 });
      expect(serviceRepo.softDeleteCascade).not.toHaveBeenCalled();
    });
  });
});

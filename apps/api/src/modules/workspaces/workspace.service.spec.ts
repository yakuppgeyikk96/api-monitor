import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { ErrorCode } from '@repo/shared-types/errors';
import { AppError } from '../../common/errors.js';
import type { WorkspaceRepository } from './workspace.repository.js';
import { createWorkspaceService } from './workspace.service.js';

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

function createMockWorkspaceRepository(): MockedRepository<WorkspaceRepository> {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findBySlug: vi.fn(),
    findAllByOwnerId: vi.fn(),
    update: vi.fn(),
    softDeleteCascade: vi.fn(),
  };
}

describe('WorkspaceService', () => {
  let mockRepo: MockedRepository<WorkspaceRepository>;
  let service: ReturnType<typeof createWorkspaceService>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepo = createMockWorkspaceRepository();
    service = createWorkspaceService(mockRepo);
  });

  describe('create', () => {
    it('should use provided slug and create workspace', async () => {
      mockRepo.findBySlug.mockResolvedValue(null);
      mockRepo.create.mockResolvedValue(mockWorkspace);

      const result = await service.create(10, { name: 'My Workspace', slug: 'custom-slug' });

      expect(mockRepo.findBySlug).toHaveBeenCalledWith('custom-slug');
      expect(mockRepo.create).toHaveBeenCalledWith({
        ownerId: 10,
        name: 'My Workspace',
        slug: 'custom-slug',
      });
      expect(result).toEqual(mockWorkspace);
    });

    it('should generate slug from name when slug is not provided', async () => {
      mockRepo.findBySlug.mockResolvedValue(null);
      mockRepo.create.mockResolvedValue(mockWorkspace);

      await service.create(10, { name: 'My Workspace' });

      expect(mockRepo.findBySlug).toHaveBeenCalledWith('my-workspace');
      expect(mockRepo.create).toHaveBeenCalledWith({
        ownerId: 10,
        name: 'My Workspace',
        slug: 'my-workspace',
      });
    });

    it('should throw SLUG_TAKEN if slug is already in use', async () => {
      mockRepo.findBySlug.mockResolvedValue(mockWorkspace);

      await expect(service.create(10, { name: 'Test', slug: 'my-workspace' }))
        .rejects.toMatchObject({ code: ErrorCode.SLUG_TAKEN, statusCode: 409 });
      expect(mockRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('list', () => {
    it('should return all workspaces for the owner', async () => {
      const workspaces = [mockWorkspace];
      mockRepo.findAllByOwnerId.mockResolvedValue(workspaces);

      const result = await service.list(10);

      expect(mockRepo.findAllByOwnerId).toHaveBeenCalledWith(10);
      expect(result).toEqual(workspaces);
    });
  });

  describe('getById', () => {
    it('should return workspace if user is the owner', async () => {
      mockRepo.findById.mockResolvedValue(mockWorkspace);

      const result = await service.getById(1, 10);

      expect(mockRepo.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockWorkspace);
    });

    it('should throw WORKSPACE_NOT_FOUND if workspace does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.getById(999, 10))
        .rejects.toMatchObject({ code: ErrorCode.WORKSPACE_NOT_FOUND, statusCode: 404 });
    });

    it('should throw FORBIDDEN if user is not the owner', async () => {
      mockRepo.findById.mockResolvedValue(mockWorkspace);

      await expect(service.getById(1, 999))
        .rejects.toMatchObject({ code: ErrorCode.FORBIDDEN, statusCode: 403 });
    });
  });

  describe('update', () => {
    it('should update workspace when user is the owner', async () => {
      const updated = { ...mockWorkspace, name: 'Updated' };
      mockRepo.findById.mockResolvedValue(mockWorkspace);
      mockRepo.update.mockResolvedValue(updated);

      const result = await service.update(1, 10, { name: 'Updated' });

      expect(mockRepo.update).toHaveBeenCalledWith(1, { name: 'Updated' });
      expect(result).toEqual(updated);
    });

    it('should check slug availability when slug is being updated', async () => {
      mockRepo.findById.mockResolvedValue(mockWorkspace);
      mockRepo.findBySlug.mockResolvedValue(null);
      mockRepo.update.mockResolvedValue(mockWorkspace);

      await service.update(1, 10, { slug: 'new-slug' });

      expect(mockRepo.findBySlug).toHaveBeenCalledWith('new-slug');
    });

    it('should allow keeping the same slug on update', async () => {
      mockRepo.findById.mockResolvedValue(mockWorkspace);
      mockRepo.findBySlug.mockResolvedValue(mockWorkspace);
      mockRepo.update.mockResolvedValue(mockWorkspace);

      await expect(service.update(1, 10, { slug: 'my-workspace' })).resolves.toBeDefined();
    });

    it('should throw SLUG_TAKEN if new slug belongs to another workspace', async () => {
      const otherWorkspace = { ...mockWorkspace, id: 2 };
      mockRepo.findById.mockResolvedValue(mockWorkspace);
      mockRepo.findBySlug.mockResolvedValue(otherWorkspace);

      await expect(service.update(1, 10, { slug: 'taken-slug' }))
        .rejects.toMatchObject({ code: ErrorCode.SLUG_TAKEN, statusCode: 409 });
      expect(mockRepo.update).not.toHaveBeenCalled();
    });

    it('should throw FORBIDDEN if user is not the owner', async () => {
      mockRepo.findById.mockResolvedValue(mockWorkspace);

      await expect(service.update(1, 999, { name: 'Hacked' }))
        .rejects.toMatchObject({ code: ErrorCode.FORBIDDEN, statusCode: 403 });
      expect(mockRepo.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should soft delete cascade when user is the owner', async () => {
      mockRepo.findById.mockResolvedValue(mockWorkspace);
      mockRepo.softDeleteCascade.mockResolvedValue(undefined);

      await service.remove(1, 10);

      expect(mockRepo.softDeleteCascade).toHaveBeenCalledWith(1);
    });

    it('should throw WORKSPACE_NOT_FOUND if workspace does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.remove(999, 10))
        .rejects.toMatchObject({ code: ErrorCode.WORKSPACE_NOT_FOUND, statusCode: 404 });
      expect(mockRepo.softDeleteCascade).not.toHaveBeenCalled();
    });

    it('should throw FORBIDDEN if user is not the owner', async () => {
      mockRepo.findById.mockResolvedValue(mockWorkspace);

      await expect(service.remove(1, 999))
        .rejects.toMatchObject({ code: ErrorCode.FORBIDDEN, statusCode: 403 });
      expect(mockRepo.softDeleteCascade).not.toHaveBeenCalled();
    });
  });
});

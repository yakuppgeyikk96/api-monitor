import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { ErrorCode } from '@repo/shared-types/errors';
import type { EndpointRepository } from './endpoint.repository.js';
import type { ServiceRepository } from '../services/service.repository.js';
import type { WorkspaceRepository } from '../workspaces/workspace.repository.js';
import { createEndpointService } from './endpoint.service.js';

type MockedRepository<T> = { [K in keyof T]: Mock<Extract<T[K], (...args: any[]) => any>> };

const OWNER_ID = 10;
const WORKSPACE_ID = 1;
const SERVICE_ID = 2;
const ENDPOINT_ID = 3;

const mockWorkspace = {
  id: WORKSPACE_ID,
  name: 'My Workspace',
  slug: 'my-workspace',
  ownerId: OWNER_ID,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockServiceEntity = {
  id: SERVICE_ID,
  workspaceId: WORKSPACE_ID,
  name: 'Payment API',
  baseUrl: 'https://api.payment.com',
  defaultHeaders: null,
  defaultTimeoutSeconds: 30,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockEndpoint = {
  id: ENDPOINT_ID,
  workspaceId: WORKSPACE_ID,
  serviceId: SERVICE_ID,
  name: 'Health Check',
  route: '/health',
  httpMethod: 'GET',
  expectedStatusCode: 200,
  checkIntervalSeconds: 300,
  headers: null,
  body: null,
  expectedBody: null,
  isActive: true,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function createMockEndpointRepository(): MockedRepository<EndpointRepository> {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findAllByServiceId: vi.fn(),
    update: vi.fn(),
    softDeleteCascade: vi.fn(),
  };
}

function createMockServiceRepository(): Pick<MockedRepository<ServiceRepository>, 'findById'> {
  return { findById: vi.fn() };
}

function createMockWorkspaceRepository(): Pick<MockedRepository<WorkspaceRepository>, 'findById'> {
  return { findById: vi.fn() };
}

describe('EndpointService', () => {
  let endpointRepo: MockedRepository<EndpointRepository>;
  let serviceRepo: ReturnType<typeof createMockServiceRepository>;
  let workspaceRepo: ReturnType<typeof createMockWorkspaceRepository>;
  let service: ReturnType<typeof createEndpointService>;

  beforeEach(() => {
    vi.clearAllMocks();
    endpointRepo = createMockEndpointRepository();
    serviceRepo = createMockServiceRepository();
    workspaceRepo = createMockWorkspaceRepository();
    service = createEndpointService({
      repository: endpointRepo,
      serviceRepository: serviceRepo as unknown as ServiceRepository,
      workspaceRepository: workspaceRepo as unknown as WorkspaceRepository,
    });
  });

  function setupHappyPath() {
    workspaceRepo.findById.mockResolvedValue(mockWorkspace);
    serviceRepo.findById.mockResolvedValue(mockServiceEntity);
    endpointRepo.findById.mockResolvedValue(mockEndpoint);
  }

  describe('create', () => {
    const input = { name: 'Health Check', route: '/health', httpMethod: 'GET' };

    it('should create endpoint with default values', async () => {
      workspaceRepo.findById.mockResolvedValue(mockWorkspace);
      serviceRepo.findById.mockResolvedValue(mockServiceEntity);
      endpointRepo.create.mockResolvedValue(mockEndpoint);

      const result = await service.create(WORKSPACE_ID, SERVICE_ID, OWNER_ID, input);

      expect(endpointRepo.create).toHaveBeenCalledWith({
        workspaceId: WORKSPACE_ID,
        serviceId: SERVICE_ID,
        name: 'Health Check',
        route: '/health',
        httpMethod: 'GET',
        expectedStatusCode: 200,
        checkIntervalSeconds: 300,
        headers: null,
        body: null,
        expectedBody: null,
        isActive: true,
      });
      expect(result).toEqual(mockEndpoint);
    });

    it('should use provided optional values', async () => {
      workspaceRepo.findById.mockResolvedValue(mockWorkspace);
      serviceRepo.findById.mockResolvedValue(mockServiceEntity);
      endpointRepo.create.mockResolvedValue(mockEndpoint);

      await service.create(WORKSPACE_ID, SERVICE_ID, OWNER_ID, {
        ...input,
        expectedStatusCode: 201,
        checkIntervalSeconds: 60,
        headers: { 'X-Api-Key': 'test' },
        body: { foo: 'bar' },
        expectedBody: { status: 'ok' },
        isActive: false,
      });

      expect(endpointRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          expectedStatusCode: 201,
          checkIntervalSeconds: 60,
          headers: { 'X-Api-Key': 'test' },
          body: { foo: 'bar' },
          expectedBody: { status: 'ok' },
          isActive: false,
        }),
      );
    });

    it('should throw WORKSPACE_NOT_FOUND if workspace does not exist', async () => {
      workspaceRepo.findById.mockResolvedValue(null);

      await expect(service.create(999, SERVICE_ID, OWNER_ID, input))
        .rejects.toMatchObject({ code: ErrorCode.WORKSPACE_NOT_FOUND, statusCode: 404 });
      expect(endpointRepo.create).not.toHaveBeenCalled();
    });

    it('should throw FORBIDDEN if user is not the workspace owner', async () => {
      workspaceRepo.findById.mockResolvedValue(mockWorkspace);

      await expect(service.create(WORKSPACE_ID, SERVICE_ID, 999, input))
        .rejects.toMatchObject({ code: ErrorCode.FORBIDDEN, statusCode: 403 });
      expect(endpointRepo.create).not.toHaveBeenCalled();
    });

    it('should throw SERVICE_NOT_FOUND if service does not exist', async () => {
      workspaceRepo.findById.mockResolvedValue(mockWorkspace);
      serviceRepo.findById.mockResolvedValue(null);

      await expect(service.create(WORKSPACE_ID, 999, OWNER_ID, input))
        .rejects.toMatchObject({ code: ErrorCode.SERVICE_NOT_FOUND, statusCode: 404 });
      expect(endpointRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('list', () => {
    it('should return all endpoints for the service', async () => {
      workspaceRepo.findById.mockResolvedValue(mockWorkspace);
      serviceRepo.findById.mockResolvedValue(mockServiceEntity);
      endpointRepo.findAllByServiceId.mockResolvedValue([mockEndpoint]);

      const result = await service.list(WORKSPACE_ID, SERVICE_ID, OWNER_ID);

      expect(endpointRepo.findAllByServiceId).toHaveBeenCalledWith(SERVICE_ID);
      expect(result).toEqual([mockEndpoint]);
    });

    it('should throw SERVICE_NOT_FOUND if service does not exist', async () => {
      workspaceRepo.findById.mockResolvedValue(mockWorkspace);
      serviceRepo.findById.mockResolvedValue(null);

      await expect(service.list(WORKSPACE_ID, 999, OWNER_ID))
        .rejects.toMatchObject({ code: ErrorCode.SERVICE_NOT_FOUND, statusCode: 404 });
    });
  });

  describe('getById', () => {
    it('should return endpoint when all validations pass', async () => {
      setupHappyPath();

      const result = await service.getById(ENDPOINT_ID, SERVICE_ID, WORKSPACE_ID, OWNER_ID);

      expect(result).toEqual(mockEndpoint);
    });

    it('should throw ENDPOINT_NOT_FOUND if endpoint does not exist', async () => {
      workspaceRepo.findById.mockResolvedValue(mockWorkspace);
      serviceRepo.findById.mockResolvedValue(mockServiceEntity);
      endpointRepo.findById.mockResolvedValue(null);

      await expect(service.getById(999, SERVICE_ID, WORKSPACE_ID, OWNER_ID))
        .rejects.toMatchObject({ code: ErrorCode.ENDPOINT_NOT_FOUND, statusCode: 404 });
    });
  });

  describe('update', () => {
    it('should update endpoint when all validations pass', async () => {
      const updated = { ...mockEndpoint, name: 'Updated' };
      setupHappyPath();
      endpointRepo.update.mockResolvedValue(updated);

      const result = await service.update(ENDPOINT_ID, SERVICE_ID, WORKSPACE_ID, OWNER_ID, { name: 'Updated' });

      expect(endpointRepo.update).toHaveBeenCalledWith(ENDPOINT_ID, SERVICE_ID, { name: 'Updated' });
      expect(result).toEqual(updated);
    });

    it('should throw ENDPOINT_NOT_FOUND if endpoint does not exist', async () => {
      workspaceRepo.findById.mockResolvedValue(mockWorkspace);
      serviceRepo.findById.mockResolvedValue(mockServiceEntity);
      endpointRepo.findById.mockResolvedValue(null);

      await expect(service.update(999, SERVICE_ID, WORKSPACE_ID, OWNER_ID, { name: 'X' }))
        .rejects.toMatchObject({ code: ErrorCode.ENDPOINT_NOT_FOUND, statusCode: 404 });
      expect(endpointRepo.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should soft delete when all validations pass', async () => {
      setupHappyPath();
      endpointRepo.softDeleteCascade.mockResolvedValue(undefined);

      await service.remove(ENDPOINT_ID, SERVICE_ID, WORKSPACE_ID, OWNER_ID);

      expect(endpointRepo.softDeleteCascade).toHaveBeenCalledWith(ENDPOINT_ID, SERVICE_ID);
    });

    it('should throw FORBIDDEN if user is not the workspace owner', async () => {
      workspaceRepo.findById.mockResolvedValue(mockWorkspace);

      await expect(service.remove(ENDPOINT_ID, SERVICE_ID, WORKSPACE_ID, 999))
        .rejects.toMatchObject({ code: ErrorCode.FORBIDDEN, statusCode: 403 });
      expect(endpointRepo.softDeleteCascade).not.toHaveBeenCalled();
    });

    it('should throw ENDPOINT_NOT_FOUND if endpoint does not exist', async () => {
      workspaceRepo.findById.mockResolvedValue(mockWorkspace);
      serviceRepo.findById.mockResolvedValue(mockServiceEntity);
      endpointRepo.findById.mockResolvedValue(null);

      await expect(service.remove(999, SERVICE_ID, WORKSPACE_ID, OWNER_ID))
        .rejects.toMatchObject({ code: ErrorCode.ENDPOINT_NOT_FOUND, statusCode: 404 });
      expect(endpointRepo.softDeleteCascade).not.toHaveBeenCalled();
    });
  });
});
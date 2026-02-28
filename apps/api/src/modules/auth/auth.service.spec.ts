import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { ErrorCode } from '@repo/shared-types/errors';
import { AuthError } from '../../common/errors.js';
import type { UserRepository } from '../users/user.repository.js';
import { createAuthService } from './auth.service.js';

vi.mock('../../common/password.js', () => ({
  hashPassword: vi.fn().mockResolvedValue('hashed_password'),
  verifyPassword: vi.fn().mockResolvedValue(true),
}));

import { hashPassword, verifyPassword } from '../../common/password.js';

const mockUser = {
  id: 1,
  email: 'test@example.com',
  fullName: 'Test User',
  avatarUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockUserWithPassword = {
  ...mockUser,
  passwordHash: 'hashed_password',
  deletedAt: null,
};

type MockedRepository<T> = { [K in keyof T]: Mock<Extract<T[K], (...args: any[]) => any>> };

function createMockUserRepository(): MockedRepository<UserRepository> {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findByEmail: vi.fn(),
    findByEmailWithPassword: vi.fn(),
  };
}

function createMockFastify() {
  return {
    jwt: {
      sign: vi.fn().mockReturnValue('mock-jwt-token'),
    },
  } as unknown as FastifyInstance;
}

describe('AuthService', () => {
  let mockRepo: ReturnType<typeof createMockUserRepository>;
  let mockFastify: FastifyInstance;
  let service: ReturnType<typeof createAuthService>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepo = createMockUserRepository();
    mockFastify = createMockFastify();
    service = createAuthService(mockFastify, mockRepo);
  });

  describe('register', () => {
    const input = { email: 'test@example.com', password: 'secret123', fullName: 'Test User' };

    it('should create user, sign token, and return AuthResult', async () => {
      mockRepo.findByEmail.mockResolvedValue(null);
      mockRepo.create.mockResolvedValue(mockUser);

      const result = await service.register(input);

      expect(mockRepo.findByEmail).toHaveBeenCalledWith(input.email);
      expect(hashPassword).toHaveBeenCalledWith(input.password);
      expect(mockRepo.create).toHaveBeenCalledWith({
        email: input.email,
        passwordHash: 'hashed_password',
        fullName: input.fullName,
      });
      expect(mockFastify.jwt.sign).toHaveBeenCalledWith({ sub: 1, email: input.email });
      expect(result).toEqual({
        token: 'mock-jwt-token',
        user: { id: 1, email: input.email, fullName: input.fullName, avatarUrl: null },
      });
    });

    it('should throw EMAIL_TAKEN if email already exists', async () => {
      mockRepo.findByEmail.mockResolvedValue(mockUser);

      await expect(service.register(input)).rejects.toThrow(AuthError);
      await expect(service.register(input)).rejects.toMatchObject({
        code: ErrorCode.EMAIL_TAKEN,
      });
      expect(mockRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const input = { email: 'test@example.com', password: 'secret123' };

    it('should verify password, sign token, and return AuthResult', async () => {
      mockRepo.findByEmailWithPassword.mockResolvedValue(mockUserWithPassword);

      const result = await service.login(input);

      expect(mockRepo.findByEmailWithPassword).toHaveBeenCalledWith(input.email);
      expect(verifyPassword).toHaveBeenCalledWith('hashed_password', input.password);
      expect(mockFastify.jwt.sign).toHaveBeenCalledWith({ sub: 1, email: input.email });
      expect(result).toEqual({
        token: 'mock-jwt-token',
        user: { id: 1, email: input.email, fullName: 'Test User', avatarUrl: null },
      });
    });

    it('should throw INVALID_CREDENTIALS if user not found', async () => {
      mockRepo.findByEmailWithPassword.mockResolvedValue(null);

      await expect(service.login(input)).rejects.toThrow(AuthError);
      await expect(service.login(input)).rejects.toMatchObject({
        code: ErrorCode.INVALID_CREDENTIALS,
      });
      expect(verifyPassword).not.toHaveBeenCalled();
    });

    it('should throw INVALID_CREDENTIALS if password is wrong', async () => {
      mockRepo.findByEmailWithPassword.mockResolvedValue(mockUserWithPassword);
      vi.mocked(verifyPassword).mockResolvedValueOnce(false);

      const promise = service.login(input);

      await expect(promise).rejects.toThrow(AuthError);
    });
  });

  describe('me', () => {
    it('should return AuthUser for existing user', async () => {
      mockRepo.findById.mockResolvedValue(mockUser);

      const result = await service.me(1);

      expect(mockRepo.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual({
        id: 1,
        email: 'test@example.com',
        fullName: 'Test User',
        avatarUrl: null,
      });
    });

    it('should throw USER_NOT_FOUND if user does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.me(999)).rejects.toThrow(AuthError);
      await expect(service.me(999)).rejects.toMatchObject({
        code: ErrorCode.USER_NOT_FOUND,
      });
    });

    it('should not expose passwordHash in returned user', async () => {
      mockRepo.findById.mockResolvedValue(mockUser);

      const result = await service.me(1);

      expect(result).not.toHaveProperty('passwordHash');
      expect(result).not.toHaveProperty('deletedAt');
      expect(result).not.toHaveProperty('createdAt');
      expect(result).not.toHaveProperty('updatedAt');
    });
  });
});

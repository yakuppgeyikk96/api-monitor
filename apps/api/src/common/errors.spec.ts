import { describe, it, expect } from 'vitest';
import { AuthError, AppError } from './errors.js';

describe('AuthError', () => {
  it('should store code and message', () => {
    const error = new AuthError('EMAIL_TAKEN', 'Email already taken');
    expect(error.code).toBe('EMAIL_TAKEN');
    expect(error.message).toBe('Email already taken');
  });

  it('should have name set to AuthError', () => {
    const error = new AuthError('UNAUTHORIZED', 'Not authorized');
    expect(error.name).toBe('AuthError');
  });

  it('should be an instance of Error', () => {
    const error = new AuthError('UNAUTHORIZED', 'Not authorized');
    expect(error).toBeInstanceOf(Error);
  });
});

describe('AppError', () => {
  it('should store code, message, and statusCode', () => {
    const error = new AppError('NOT_FOUND', 'Resource not found', 404);
    expect(error.code).toBe('NOT_FOUND');
    expect(error.message).toBe('Resource not found');
    expect(error.statusCode).toBe(404);
  });

  it('should default statusCode to 400', () => {
    const error = new AppError('VALIDATION_ERROR', 'Invalid input');
    expect(error.statusCode).toBe(400);
  });

  it('should have name set to AppError', () => {
    const error = new AppError('NOT_FOUND', 'Not found', 404);
    expect(error.name).toBe('AppError');
  });

  it('should be an instance of Error', () => {
    const error = new AppError('NOT_FOUND', 'Not found', 404);
    expect(error).toBeInstanceOf(Error);
  });
});

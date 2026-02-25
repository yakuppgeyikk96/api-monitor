import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from './password.js';

describe('hashPassword', () => {
  it('should return a hash different from the plain password', async () => {
    const hash = await hashPassword('mySecret123');
    expect(hash).not.toBe('mySecret123');
    expect(hash.length).toBeGreaterThan(0);
  });
});

describe('verifyPassword', () => {
  it('should return true for a correct password', async () => {
    const hash = await hashPassword('correctPassword');
    const result = await verifyPassword(hash, 'correctPassword');
    expect(result).toBe(true);
  });

  it('should return false for a wrong password', async () => {
    const hash = await hashPassword('correctPassword');
    const result = await verifyPassword(hash, 'wrongPassword');
    expect(result).toBe(false);
  });
});

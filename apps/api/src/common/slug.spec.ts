import { describe, it, expect } from 'vitest';
import { generateSlug } from './slug.js';

describe('generateSlug', () => {
  it('should convert spaced name to kebab-case', () => {
    expect(generateSlug('My Workspace')).toBe('my-workspace');
  });

  it('should lowercase uppercase characters', () => {
    expect(generateSlug('UPPER')).toBe('upper');
  });

  it('should remove special characters', () => {
    expect(generateSlug('hello@world!')).toBe('helloworld');
  });

  it('should collapse multiple spaces into a single hyphen', () => {
    expect(generateSlug('a   b')).toBe('a-b');
  });

  it('should preserve already kebab-cased string', () => {
    expect(generateSlug('my-slug')).toBe('my-slug');
  });

  it('should return empty string for empty input', () => {
    expect(generateSlug('')).toBe('');
  });
});

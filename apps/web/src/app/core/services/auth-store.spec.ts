import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import type { AuthUser } from '@repo/shared-types';
import { AuthApi } from './auth-api';
import { AuthStore } from './auth-store';

const mockUser: AuthUser = {
  id: 1,
  email: 'test@example.com',
  fullName: 'Test User',
  avatarUrl: null,
};

function createMockAuthApi(): Record<keyof AuthApi, ReturnType<typeof vi.fn>> {
  return {
    me: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  };
}

describe('AuthStore', () => {
  let store: AuthStore;
  let authApiMock: ReturnType<typeof createMockAuthApi>;

  beforeEach(() => {
    authApiMock = createMockAuthApi();

    TestBed.configureTestingModule({
      providers: [AuthStore, { provide: AuthApi, useValue: authApiMock }],
    });

    store = TestBed.inject(AuthStore);
  });

  it('should start with user as null', () => {
    expect(store.user()).toBeNull();
  });

  it('should start with isAuthenticated as false', () => {
    expect(store.isAuthenticated()).toBe(false);
  });

  it('should set user and update isAuthenticated', () => {
    store.setUser(mockUser);

    expect(store.user()).toEqual(mockUser);
    expect(store.isAuthenticated()).toBe(true);
  });

  it('should clear user and reset isAuthenticated', () => {
    store.setUser(mockUser);
    store.clear();

    expect(store.user()).toBeNull();
    expect(store.isAuthenticated()).toBe(false);
  });

  it('should set user on successful init()', async () => {
    authApiMock.me.mockReturnValue(of({ success: true as const, data: mockUser }));

    await store.init();

    expect(store.user()).toEqual(mockUser);
    expect(store.isAuthenticated()).toBe(true);
  });

  it('should resolve without error on failed init()', async () => {
    authApiMock.me.mockReturnValue(throwError(() => new Error('Unauthorized')));

    await store.init();

    expect(store.user()).toBeNull();
    expect(store.isAuthenticated()).toBe(false);
  });
});

import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, type UrlTree } from '@angular/router';
import { AuthStore } from '../services/auth-store';
import { authGuard } from './auth-guard';

describe('authGuard', () => {
  let authStore: { isAuthenticated: ReturnType<typeof vi.fn> };
  let router: Router;

  beforeEach(() => {
    authStore = { isAuthenticated: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthStore, useValue: authStore },
      ],
    });

    router = TestBed.inject(Router);
  });

  function runGuard(url = '/dashboard') {
    const mockState = { url } as any;
    return TestBed.runInInjectionContext(() => authGuard({} as any, mockState));
  }

  it('should return true if authenticated', () => {
    authStore.isAuthenticated.mockReturnValue(true);

    expect(runGuard()).toBe(true);
  });

  it('should redirect to /auth/login if not authenticated', () => {
    authStore.isAuthenticated.mockReturnValue(false);

    const result = runGuard('/') as UrlTree;

    expect(result.toString()).toBe('/auth/login');
  });

  it('should include returnUrl if original URL is not /', () => {
    authStore.isAuthenticated.mockReturnValue(false);

    const result = runGuard('/workspaces') as UrlTree;

    expect(result.toString()).toBe('/auth/login?returnUrl=%2Fworkspaces');
  });
});

import { TestBed } from '@angular/core/testing';
import { provideRouter, type UrlTree } from '@angular/router';
import { AuthStore } from '../services/auth-store';
import { guestGuard } from './guest-guard';

describe('guestGuard', () => {
  let authStore: { isAuthenticated: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authStore = { isAuthenticated: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthStore, useValue: authStore },
      ],
    });
  });

  function runGuard() {
    return TestBed.runInInjectionContext(() => guestGuard({} as any, {} as any));
  }

  it('should return true if not authenticated', () => {
    authStore.isAuthenticated.mockReturnValue(false);

    expect(runGuard()).toBe(true);
  });

  it('should redirect to /dashboard if authenticated', () => {
    authStore.isAuthenticated.mockReturnValue(true);

    const result = runGuard() as UrlTree;

    expect(result.toString()).toBe('/dashboard');
  });
});

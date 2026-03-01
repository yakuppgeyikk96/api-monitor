import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthStore } from '../services/auth-store';
import { authInterceptor } from './auth-interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let authStore: { clear: ReturnType<typeof vi.fn> };
  let router: Router;

  beforeEach(() => {
    authStore = { clear: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthStore, useValue: authStore },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should pass successful responses through', () => {
    http.get('/api/test').subscribe((res) => {
      expect(res).toEqual({ data: 'ok' });
    });

    httpTesting.expectOne('/api/test').flush({ data: 'ok' });
  });

  it('should clear store and redirect on 401 error', () => {
    http.get('/api/protected').subscribe({ error: () => {} });

    httpTesting.expectOne('/api/protected').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(authStore.clear).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/auth/login');
  });

  it('should NOT redirect on 401 for /auth/me requests', () => {
    http.get('/api/auth/me').subscribe({ error: () => {} });

    httpTesting.expectOne('/api/auth/me').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(authStore.clear).not.toHaveBeenCalled();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('should not intercept non-401 errors', () => {
    http.get('/api/test').subscribe({ error: () => {} });

    httpTesting.expectOne('/api/test').flush(null, { status: 500, statusText: 'Server Error' });

    expect(authStore.clear).not.toHaveBeenCalled();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });
});

import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthApi } from './auth-api';

describe('AuthApi', () => {
  let service: AuthApi;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthApi);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should POST to /api/auth/register', () => {
    const input = { email: 'a@b.com', password: 'pass123', fullName: 'Test' };
    const mockResponse = { success: true as const, data: { id: 1, email: 'a@b.com', fullName: 'Test', avatarUrl: null } };

    service.register(input).subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpTesting.expectOne('/api/auth/register');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(input);
    req.flush(mockResponse);
  });

  it('should POST to /api/auth/login', () => {
    const input = { email: 'a@b.com', password: 'pass123' };

    service.login(input).subscribe();

    const req = httpTesting.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(input);
    req.flush({ success: true, data: {} });
  });

  it('should GET /api/auth/me', () => {
    service.me().subscribe();

    const req = httpTesting.expectOne('/api/auth/me');
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: {} });
  });

  it('should POST to /api/auth/logout', () => {
    service.logout().subscribe();

    const req = httpTesting.expectOne('/api/auth/logout');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush({ success: true, data: null });
  });
});

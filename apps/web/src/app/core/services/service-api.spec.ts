import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ServiceApi } from './service-api';

describe('ServiceApi', () => {
  let service: ServiceApi;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ServiceApi);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should GET /api/workspaces/:wId/services', () => {
    service.list(1).subscribe();

    const req = httpTesting.expectOne('/api/workspaces/1/services');
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: [] });
  });

  it('should POST to /api/workspaces/:wId/services', () => {
    const input = { name: 'Payment API', baseUrl: 'https://api.pay.com' };

    service.create(1, input).subscribe();

    const req = httpTesting.expectOne('/api/workspaces/1/services');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(input);
    req.flush({ success: true, data: {} });
  });

  it('should PATCH /api/workspaces/:wId/services/:id', () => {
    const input = { name: 'Updated' };

    service.update(1, 2, input).subscribe();

    const req = httpTesting.expectOne('/api/workspaces/1/services/2');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(input);
    req.flush({ success: true, data: {} });
  });

  it('should DELETE /api/workspaces/:wId/services/:id', () => {
    service.remove(1, 2).subscribe();

    const req = httpTesting.expectOne('/api/workspaces/1/services/2');
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true, data: null });
  });
});

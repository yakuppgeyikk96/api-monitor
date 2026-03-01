import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { EndpointApi } from './endpoint-api';

describe('EndpointApi', () => {
  let service: EndpointApi;
  let httpTesting: HttpTestingController;

  const BASE = '/api/workspaces/1/services/2/endpoints';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(EndpointApi);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should GET /api/workspaces/:wId/services/:sId/endpoints', () => {
    service.list(1, 2).subscribe();

    const req = httpTesting.expectOne(BASE);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: [] });
  });

  it('should POST to /api/workspaces/:wId/services/:sId/endpoints', () => {
    const input = { name: 'Health', route: '/health', httpMethod: 'GET' };

    service.create(1, 2, input).subscribe();

    const req = httpTesting.expectOne(BASE);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(input);
    req.flush({ success: true, data: {} });
  });

  it('should PATCH /api/workspaces/:wId/services/:sId/endpoints/:id', () => {
    const input = { name: 'Updated' };

    service.update(1, 2, 3, input).subscribe();

    const req = httpTesting.expectOne(`${BASE}/3`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(input);
    req.flush({ success: true, data: {} });
  });

  it('should DELETE /api/workspaces/:wId/services/:sId/endpoints/:id', () => {
    service.remove(1, 2, 3).subscribe();

    const req = httpTesting.expectOne(`${BASE}/3`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true, data: null });
  });
});

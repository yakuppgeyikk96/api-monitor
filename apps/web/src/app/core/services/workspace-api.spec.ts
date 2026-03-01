import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { WorkspaceApi } from './workspace-api';

describe('WorkspaceApi', () => {
  let service: WorkspaceApi;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(WorkspaceApi);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should POST to /api/workspaces', () => {
    const input = { name: 'My Workspace' };

    service.create(input).subscribe();

    const req = httpTesting.expectOne('/api/workspaces');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(input);
    req.flush({ success: true, data: {} });
  });

  it('should GET /api/workspaces', () => {
    service.list().subscribe();

    const req = httpTesting.expectOne('/api/workspaces');
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: [] });
  });

  it('should PATCH /api/workspaces/:id', () => {
    const input = { name: 'Updated' };

    service.update(1, input).subscribe();

    const req = httpTesting.expectOne('/api/workspaces/1');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(input);
    req.flush({ success: true, data: {} });
  });

  it('should DELETE /api/workspaces/:id', () => {
    service.remove(1).subscribe();

    const req = httpTesting.expectOne('/api/workspaces/1');
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true, data: null });
  });
});

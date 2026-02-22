import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import type { ApiResponse, CreateWorkspaceInput, Workspace } from '@repo/shared-types';

import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WorkspaceApi {
  private http = inject(HttpClient);

  create(input: CreateWorkspaceInput): Observable<ApiResponse<Workspace>> {
    return this.http.post<ApiResponse<Workspace>>(`${environment.apiUrl}/workspaces`, input);
  }

  list(): Observable<ApiResponse<Workspace[]>> {
    return this.http.get<ApiResponse<Workspace[]>>(`${environment.apiUrl}/workspaces`);
  }
}

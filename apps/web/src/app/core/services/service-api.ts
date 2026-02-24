import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import type {
  ApiResponse,
  Service,
  CreateServiceInput,
  UpdateServiceInput,
} from '@repo/shared-types';

import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ServiceApi {
  private http = inject(HttpClient);

  private url(workspaceId: number, id?: number): string {
    const base = `${environment.apiUrl}/workspaces/${workspaceId}/services`;
    return id !== undefined ? `${base}/${id}` : base;
  }

  list(workspaceId: number): Observable<ApiResponse<Service[]>> {
    return this.http.get<ApiResponse<Service[]>>(this.url(workspaceId));
  }

  create(workspaceId: number, input: CreateServiceInput): Observable<ApiResponse<Service>> {
    return this.http.post<ApiResponse<Service>>(this.url(workspaceId), input);
  }

  update(workspaceId: number, id: number, input: UpdateServiceInput): Observable<ApiResponse<Service>> {
    return this.http.patch<ApiResponse<Service>>(this.url(workspaceId, id), input);
  }

  remove(workspaceId: number, id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(this.url(workspaceId, id));
  }
}

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import type {
  ApiResponse,
  Endpoint,
  CreateEndpointInput,
  UpdateEndpointInput,
} from '@repo/shared-types';

import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EndpointApi {
  private http = inject(HttpClient);

  private url(workspaceId: number, serviceId: number, id?: number): string {
    const base = `${environment.apiUrl}/workspaces/${workspaceId}/services/${serviceId}/endpoints`;
    return id !== undefined ? `${base}/${id}` : base;
  }

  list(workspaceId: number, serviceId: number): Observable<ApiResponse<Endpoint[]>> {
    return this.http.get<ApiResponse<Endpoint[]>>(this.url(workspaceId, serviceId));
  }

  create(
    workspaceId: number,
    serviceId: number,
    input: CreateEndpointInput,
  ): Observable<ApiResponse<Endpoint>> {
    return this.http.post<ApiResponse<Endpoint>>(this.url(workspaceId, serviceId), input);
  }

  update(
    workspaceId: number,
    serviceId: number,
    id: number,
    input: UpdateEndpointInput,
  ): Observable<ApiResponse<Endpoint>> {
    return this.http.patch<ApiResponse<Endpoint>>(this.url(workspaceId, serviceId, id), input);
  }

  remove(workspaceId: number, serviceId: number, id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(this.url(workspaceId, serviceId, id));
  }
}

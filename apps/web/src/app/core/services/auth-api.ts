import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import type { ApiResponse, AuthUser, LoginInput, RegisterInput } from '@repo/shared-types';

import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private http = inject(HttpClient);

  register(input: RegisterInput): Observable<ApiResponse<AuthUser>> {
    return this.http.post<ApiResponse<AuthUser>>(`${environment.apiUrl}/auth/register`, input);
  }

  login(input: LoginInput): Observable<ApiResponse<AuthUser>> {
    return this.http.post<ApiResponse<AuthUser>>(`${environment.apiUrl}/auth/login`, input);
  }
}

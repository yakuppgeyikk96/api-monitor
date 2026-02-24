import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import type {
  ApiError,
  CreateEndpointInput,
  UpdateEndpointInput,
  Endpoint,
  Service,
  Workspace,
} from '@repo/shared-types';

import { WorkspaceApi } from '../../core/services/workspace-api';
import { ServiceApi } from '../../core/services/service-api';
import { EndpointApi } from '../../core/services/endpoint-api';
import { VALIDATION_MESSAGES } from '../../shared/constants/validation';
import { Button } from '../../shared/components/button/button';
import { Input } from '../../shared/components/input/input';
import { Dialog } from '../../shared/components/dialog/dialog';
import { DataTable } from '../../shared/components/data-table/data-table';
import { TableCellDef } from '../../shared/components/data-table/table-cell-def';
import { TableEmptyDef } from '../../shared/components/data-table/table-empty-def';
import type { TableColumn } from '../../shared/components/data-table/table-column';
import { RadioTowerIcon } from '../../shared/icons/radio-tower-icon';
import { PencilIcon } from '../../shared/icons/pencil-icon';
import { TrashIcon } from '../../shared/icons/trash-icon';

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const;

@Component({
  selector: 'app-endpoints',
  imports: [
    ReactiveFormsModule,
    DatePipe,
    Button,
    Input,
    Dialog,
    DataTable,
    TableCellDef,
    TableEmptyDef,
    RadioTowerIcon,
    PencilIcon,
    TrashIcon,
  ],
  templateUrl: './endpoints.html',
})
export class Endpoints implements OnInit {
  private fb = inject(FormBuilder);
  private workspaceApi = inject(WorkspaceApi);
  private serviceApi = inject(ServiceApi);
  private endpointApi = inject(EndpointApi);

  protected readonly httpMethods = HTTP_METHODS;

  protected columns: TableColumn[] = [
    { key: 'name', header: 'Name' },
    { key: 'route', header: 'Route' },
    { key: 'httpMethod', header: 'Method' },
    { key: 'expectedStatusCode', header: 'Expected Status' },
    { key: 'isActive', header: 'Active' },
    { key: 'createdAt', header: 'Created' },
    { key: 'actions', header: '' },
  ];

  // Workspace state
  protected workspaces = signal<Workspace[]>([]);
  protected workspacesLoading = signal(true);
  protected selectedWorkspaceId = signal<number | null>(null);

  // Service state
  protected services = signal<Service[]>([]);
  protected servicesLoading = signal(false);
  protected selectedServiceId = signal<number | null>(null);

  // Endpoint state
  protected endpoints = signal<Endpoint[]>([]);
  protected listLoading = signal(false);
  protected showCreateDialog = signal(false);
  protected showEditDialog = signal(false);
  protected showDeleteDialog = signal(false);
  protected selectedEndpoint = signal<Endpoint | null>(null);
  protected formLoading = signal(false);
  protected deleteLoading = signal(false);
  protected serverError = signal('');

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    route: ['', [Validators.required, Validators.maxLength(2048)]],
    httpMethod: ['GET', [Validators.required]],
    expectedStatusCode: [200, [Validators.required, Validators.min(100), Validators.max(599)]],
    checkIntervalSeconds: [300, [Validators.required, Validators.min(10), Validators.max(86400)]],
    isActive: [true],
    headers: [''],
    body: [''],
    expectedBody: [''],
  });

  ngOnInit(): void {
    this.workspaceApi.list().subscribe({
      next: (res) => {
        this.workspaces.set(res.data);
        this.workspacesLoading.set(false);
        if (res.data.length > 0) {
          this.onWorkspaceChange(res.data[0].id);
        }
      },
      error: () => {
        this.workspacesLoading.set(false);
      },
    });
  }

  onWorkspaceChange(workspaceId: number): void {
    this.selectedWorkspaceId.set(workspaceId);
    this.selectedServiceId.set(null);
    this.endpoints.set([]);
    this.loadServices(workspaceId);
  }

  onServiceChange(serviceId: number): void {
    this.selectedServiceId.set(serviceId);
    const workspaceId = this.selectedWorkspaceId();
    if (workspaceId !== null) {
      this.loadEndpoints(workspaceId, serviceId);
    }
  }

  onSubmit(): void {
    const workspaceId = this.selectedWorkspaceId();
    const serviceId = this.selectedServiceId();
    if (this.form.invalid || workspaceId === null || serviceId === null) {
      this.form.markAllAsTouched();
      return;
    }

    this.formLoading.set(true);
    this.serverError.set('');

    const raw = this.form.getRawValue();
    const input: CreateEndpointInput = {
      name: raw.name,
      route: raw.route,
      httpMethod: raw.httpMethod,
      expectedStatusCode: raw.expectedStatusCode,
      checkIntervalSeconds: raw.checkIntervalSeconds,
      isActive: raw.isActive,
      ...this.parseJsonFields(raw),
    };

    this.endpointApi.create(workspaceId, serviceId, input).subscribe({
      next: () => {
        this.formLoading.set(false);
        this.onCreateDialogClosed();
        this.loadEndpoints(workspaceId, serviceId);
      },
      error: (err: HttpErrorResponse) => {
        this.formLoading.set(false);
        const body = err.error as ApiError | undefined;
        this.serverError.set(body?.error?.message ?? 'An unexpected error occurred');
      },
    });
  }

  onEdit(endpoint: Endpoint): void {
    this.selectedEndpoint.set(endpoint);
    this.form.patchValue({
      name: endpoint.name,
      route: endpoint.route,
      httpMethod: endpoint.httpMethod,
      expectedStatusCode: endpoint.expectedStatusCode,
      checkIntervalSeconds: endpoint.checkIntervalSeconds,
      isActive: endpoint.isActive,
      headers: endpoint.headers ? JSON.stringify(endpoint.headers, null, 2) : '',
      body: endpoint.body ? JSON.stringify(endpoint.body, null, 2) : '',
      expectedBody: endpoint.expectedBody ? JSON.stringify(endpoint.expectedBody, null, 2) : '',
    });
    this.serverError.set('');
    this.showEditDialog.set(true);
  }

  onEditSubmit(): void {
    const workspaceId = this.selectedWorkspaceId();
    const serviceId = this.selectedServiceId();
    const endpoint = this.selectedEndpoint();
    if (this.form.invalid || !workspaceId || !serviceId || !endpoint) {
      this.form.markAllAsTouched();
      return;
    }

    this.formLoading.set(true);
    this.serverError.set('');

    const raw = this.form.getRawValue();
    const input: UpdateEndpointInput = {
      name: raw.name,
      route: raw.route,
      httpMethod: raw.httpMethod,
      expectedStatusCode: raw.expectedStatusCode,
      checkIntervalSeconds: raw.checkIntervalSeconds,
      isActive: raw.isActive,
      ...this.parseJsonFields(raw),
    };

    this.endpointApi.update(workspaceId, serviceId, endpoint.id, input).subscribe({
      next: () => {
        this.formLoading.set(false);
        this.onEditDialogClosed();
        this.loadEndpoints(workspaceId, serviceId);
      },
      error: (err: HttpErrorResponse) => {
        this.formLoading.set(false);
        const body = err.error as ApiError | undefined;
        this.serverError.set(body?.error?.message ?? 'An unexpected error occurred');
      },
    });
  }

  onDelete(endpoint: Endpoint): void {
    this.selectedEndpoint.set(endpoint);
    this.showDeleteDialog.set(true);
  }

  onConfirmDelete(): void {
    const workspaceId = this.selectedWorkspaceId();
    const serviceId = this.selectedServiceId();
    const endpoint = this.selectedEndpoint();
    if (!workspaceId || !serviceId || !endpoint) return;

    this.deleteLoading.set(true);

    this.endpointApi.remove(workspaceId, serviceId, endpoint.id).subscribe({
      next: () => {
        this.deleteLoading.set(false);
        this.onDeleteDialogClosed();
        this.loadEndpoints(workspaceId, serviceId);
      },
      error: () => {
        this.deleteLoading.set(false);
      },
    });
  }

  onCreateDialogClosed(): void {
    this.showCreateDialog.set(false);
    this.resetForm();
  }

  onEditDialogClosed(): void {
    this.showEditDialog.set(false);
    this.selectedEndpoint.set(null);
    this.resetForm();
  }

  onDeleteDialogClosed(): void {
    this.showDeleteDialog.set(false);
    this.selectedEndpoint.set(null);
  }

  protected getError(field: 'name' | 'route' | 'expectedStatusCode' | 'checkIntervalSeconds'): string {
    const control = this.form.controls[field];
    if (!control.touched || !control.errors) return '';

    if (control.errors['required']) return VALIDATION_MESSAGES.required;
    if (control.errors['maxlength'])
      return `Must be at most ${control.errors['maxlength'].requiredLength} characters`;
    if (control.errors['min']) return `Minimum value is ${control.errors['min'].min}`;
    if (control.errors['max']) return `Maximum value is ${control.errors['max'].max}`;

    return '';
  }

  private loadServices(workspaceId: number): void {
    this.servicesLoading.set(true);
    this.serviceApi.list(workspaceId).subscribe({
      next: (res) => {
        this.services.set(res.data);
        this.servicesLoading.set(false);
        if (res.data.length > 0) {
          this.onServiceChange(res.data[0].id);
        }
      },
      error: () => {
        this.servicesLoading.set(false);
      },
    });
  }

  private loadEndpoints(workspaceId: number, serviceId: number): void {
    this.listLoading.set(true);
    this.endpointApi.list(workspaceId, serviceId).subscribe({
      next: (res) => {
        this.endpoints.set(res.data);
        this.listLoading.set(false);
      },
      error: () => {
        this.listLoading.set(false);
      },
    });
  }

  private resetForm(): void {
    this.form.reset({
      name: '',
      route: '',
      httpMethod: 'GET',
      expectedStatusCode: 200,
      checkIntervalSeconds: 300,
      isActive: true,
      headers: '',
      body: '',
      expectedBody: '',
    });
    this.serverError.set('');
  }

  private parseJsonFields(raw: { headers: string; body: string; expectedBody: string }): {
    headers?: Record<string, string>;
    body?: unknown;
    expectedBody?: unknown;
  } {
    const result: { headers?: Record<string, string>; body?: unknown; expectedBody?: unknown } = {};
    if (raw.headers.trim()) {
      try { result.headers = JSON.parse(raw.headers); } catch { /* skip invalid */ }
    }
    if (raw.body.trim()) {
      try { result.body = JSON.parse(raw.body); } catch { /* skip invalid */ }
    }
    if (raw.expectedBody.trim()) {
      try { result.expectedBody = JSON.parse(raw.expectedBody); } catch { /* skip invalid */ }
    }
    return result;
  }
}

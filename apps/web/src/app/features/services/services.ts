import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import type { ApiError, Service, Workspace } from '@repo/shared-types';

import { WorkspaceApi } from '../../core/services/workspace-api';
import { ServiceApi } from '../../core/services/service-api';
import { VALIDATION_MESSAGES } from '../../shared/constants/validation';
import { Button } from '../../shared/components/button/button';
import { Input } from '../../shared/components/input/input';
import { Dialog } from '../../shared/components/dialog/dialog';
import { DataTable } from '../../shared/components/data-table/data-table';
import { TableCellDef } from '../../shared/components/data-table/table-cell-def';
import { TableEmptyDef } from '../../shared/components/data-table/table-empty-def';
import type { TableColumn } from '../../shared/components/data-table/table-column';
import { ServerIcon } from '../../shared/icons/server-icon';
import { PencilIcon } from '../../shared/icons/pencil-icon';
import { TrashIcon } from '../../shared/icons/trash-icon';

@Component({
  selector: 'app-services',
  imports: [
    ReactiveFormsModule,
    DatePipe,
    Button,
    Input,
    Dialog,
    DataTable,
    TableCellDef,
    TableEmptyDef,
    ServerIcon,
    PencilIcon,
    TrashIcon,
  ],
  templateUrl: './services.html',
})
export class Services implements OnInit {
  private fb = inject(FormBuilder);
  private workspaceApi = inject(WorkspaceApi);
  private serviceApi = inject(ServiceApi);

  protected columns: TableColumn[] = [
    { key: 'name', header: 'Name' },
    { key: 'baseUrl', header: 'Base URL' },
    { key: 'defaultTimeoutSeconds', header: 'Timeout (s)' },
    { key: 'createdAt', header: 'Created' },
    { key: 'actions', header: '' },
  ];

  protected workspaces = signal<Workspace[]>([]);
  protected workspacesLoading = signal(true);
  protected selectedWorkspaceId = signal<number | null>(null);

  protected services = signal<Service[]>([]);
  protected listLoading = signal(false);
  protected showCreateDialog = signal(false);
  protected showEditDialog = signal(false);
  protected showDeleteDialog = signal(false);
  protected selectedService = signal<Service | null>(null);
  protected formLoading = signal(false);
  protected deleteLoading = signal(false);
  protected serverError = signal('');

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    baseUrl: ['', [Validators.required, Validators.maxLength(2048)]],
    defaultTimeoutSeconds: [30, [Validators.min(1), Validators.max(300)]],
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
    this.loadServices(workspaceId);
  }

  onSubmit(): void {
    const workspaceId = this.selectedWorkspaceId();
    if (this.form.invalid || workspaceId === null) {
      this.form.markAllAsTouched();
      return;
    }

    this.formLoading.set(true);
    this.serverError.set('');

    const { name, baseUrl, defaultTimeoutSeconds } = this.form.getRawValue();

    this.serviceApi.create(workspaceId, { name, baseUrl, defaultTimeoutSeconds }).subscribe({
      next: () => {
        this.formLoading.set(false);
        this.onCreateDialogClosed();
        this.loadServices(workspaceId);
      },
      error: (err: HttpErrorResponse) => {
        this.formLoading.set(false);
        const body = err.error as ApiError | undefined;
        this.serverError.set(body?.error?.message ?? 'An unexpected error occurred');
      },
    });
  }

  onEdit(service: Service): void {
    this.selectedService.set(service);
    this.form.patchValue({
      name: service.name,
      baseUrl: service.baseUrl,
      defaultTimeoutSeconds: service.defaultTimeoutSeconds,
    });
    this.serverError.set('');
    this.showEditDialog.set(true);
  }

  onEditSubmit(): void {
    const workspaceId = this.selectedWorkspaceId();
    const service = this.selectedService();
    if (this.form.invalid || !workspaceId || !service) {
      this.form.markAllAsTouched();
      return;
    }

    this.formLoading.set(true);
    this.serverError.set('');

    const { name, baseUrl, defaultTimeoutSeconds } = this.form.getRawValue();

    this.serviceApi.update(workspaceId, service.id, { name, baseUrl, defaultTimeoutSeconds }).subscribe({
      next: () => {
        this.formLoading.set(false);
        this.onEditDialogClosed();
        this.loadServices(workspaceId);
      },
      error: (err: HttpErrorResponse) => {
        this.formLoading.set(false);
        const body = err.error as ApiError | undefined;
        this.serverError.set(body?.error?.message ?? 'An unexpected error occurred');
      },
    });
  }

  onDelete(service: Service): void {
    this.selectedService.set(service);
    this.showDeleteDialog.set(true);
  }

  onConfirmDelete(): void {
    const workspaceId = this.selectedWorkspaceId();
    const service = this.selectedService();
    if (!workspaceId || !service) return;

    this.deleteLoading.set(true);

    this.serviceApi.remove(workspaceId, service.id).subscribe({
      next: () => {
        this.deleteLoading.set(false);
        this.onDeleteDialogClosed();
        this.loadServices(workspaceId);
      },
      error: () => {
        this.deleteLoading.set(false);
      },
    });
  }

  onCreateDialogClosed(): void {
    this.showCreateDialog.set(false);
    this.form.reset({ name: '', baseUrl: '', defaultTimeoutSeconds: 30 });
    this.serverError.set('');
  }

  onEditDialogClosed(): void {
    this.showEditDialog.set(false);
    this.selectedService.set(null);
    this.form.reset({ name: '', baseUrl: '', defaultTimeoutSeconds: 30 });
    this.serverError.set('');
  }

  onDeleteDialogClosed(): void {
    this.showDeleteDialog.set(false);
    this.selectedService.set(null);
  }

  protected getError(field: 'name' | 'baseUrl' | 'defaultTimeoutSeconds'): string {
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
    this.listLoading.set(true);
    this.serviceApi.list(workspaceId).subscribe({
      next: (res) => {
        this.services.set(res.data);
        this.listLoading.set(false);
      },
      error: () => {
        this.listLoading.set(false);
      },
    });
  }
}

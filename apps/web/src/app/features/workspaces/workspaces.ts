import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import type { ApiError, Workspace } from '@repo/shared-types';

import { WorkspaceApi } from '../../core/services/workspace-api';
import { VALIDATION_MESSAGES } from '../../shared/constants/validation';
import { Button } from '../../shared/components/button/button';
import { Input } from '../../shared/components/input/input';
import { Dialog } from '../../shared/components/dialog/dialog';
import { DataTable } from '../../shared/components/data-table/data-table';
import { TableCellDef } from '../../shared/components/data-table/table-cell-def';
import { TableEmptyDef } from '../../shared/components/data-table/table-empty-def';
import type { TableColumn } from '../../shared/components/data-table/table-column';

@Component({
  selector: 'app-workspaces',
  imports: [ReactiveFormsModule, DatePipe, Button, Input, Dialog, DataTable, TableCellDef, TableEmptyDef],
  templateUrl: './workspaces.html',
})
export class Workspaces implements OnInit {
  private fb = inject(FormBuilder);
  private workspaceApi = inject(WorkspaceApi);

  protected columns: TableColumn[] = [
    { key: 'name', header: 'Name' },
    { key: 'slug', header: 'Slug' },
    { key: 'plan', header: 'Plan' },
    { key: 'createdAt', header: 'Created' },
  ];

  protected workspaces = signal<Workspace[]>([]);
  protected listLoading = signal(true);
  protected showCreateDialog = signal(false);
  protected loading = signal(false);
  protected serverError = signal('');

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    slug: ['', [Validators.maxLength(60)]],
  });

  ngOnInit(): void {
    this.loadWorkspaces();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.serverError.set('');

    const { name, slug } = this.form.getRawValue();
    const input = slug ? { name, slug } : { name };

    this.workspaceApi.create(input).subscribe({
      next: () => {
        this.loading.set(false);
        this.onDialogClosed();
        this.loadWorkspaces();
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        const body = err.error as ApiError | undefined;
        this.serverError.set(body?.error?.message ?? 'An unexpected error occurred');
      },
    });
  }

  onDialogClosed(): void {
    this.showCreateDialog.set(false);
    this.form.reset();
    this.serverError.set('');
  }

  protected getError(field: 'name' | 'slug'): string {
    const control = this.form.controls[field];
    if (!control.touched || !control.errors) return '';

    if (control.errors['required']) return VALIDATION_MESSAGES.required;
    if (control.errors['maxlength']) return `Must be at most ${control.errors['maxlength'].requiredLength} characters`;

    return '';
  }

  private loadWorkspaces(): void {
    this.listLoading.set(true);

    this.workspaceApi.list().subscribe({
      next: (res) => {
        this.workspaces.set(res.data);
        this.listLoading.set(false);
      },
      error: () => {
        this.listLoading.set(false);
      },
    });
  }
}

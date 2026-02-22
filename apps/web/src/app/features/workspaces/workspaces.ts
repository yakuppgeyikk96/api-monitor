import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import type { ApiError } from '@repo/shared-types';

import { WorkspaceApi } from '../../core/services/workspace-api';
import { VALIDATION_MESSAGES } from '../../shared/constants/validation';
import { Button } from '../../shared/components/button/button';
import { Input } from '../../shared/components/input/input';
import { Dialog } from '../../shared/components/dialog/dialog';

@Component({
  selector: 'app-workspaces',
  imports: [ReactiveFormsModule, Button, Input, Dialog],
  templateUrl: './workspaces.html',
})
export class Workspaces {
  private fb = inject(FormBuilder);
  private workspaceApi = inject(WorkspaceApi);

  protected showCreateDialog = signal(false);
  protected loading = signal(false);
  protected serverError = signal('');

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    slug: ['', [Validators.maxLength(60)]],
  });

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
}

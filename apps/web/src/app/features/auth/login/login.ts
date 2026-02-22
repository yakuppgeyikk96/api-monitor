import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import type { ApiError } from '@repo/shared-types';

import { ROUTE_PATHS } from '../../../core/constants/routes';
import { AuthApi } from '../../../core/services/auth-api';
import { VALIDATION_MESSAGES, VALIDATION_RULES } from '../../../shared/constants/validation';
import { Button } from '../../../shared/components/button/button';
import { Input } from '../../../shared/components/input/input';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, Button, Input],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private fb = inject(FormBuilder);
  private authApi = inject(AuthApi);
  private router = inject(Router);

  protected readonly registerPath = ROUTE_PATHS.auth.registerFull;
  protected loading = signal(false);
  protected serverError = signal('');

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(VALIDATION_RULES.password.minLength)]],
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.serverError.set('');

    this.authApi.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.router.navigateByUrl(ROUTE_PATHS.dashboard.full);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        const body = err.error as ApiError | undefined;
        this.serverError.set(body?.error?.message ?? 'An unexpected error occurred');
      },
    });
  }

  protected getError(field: 'email' | 'password'): string {
    const control = this.form.controls[field];
    if (!control.touched || !control.errors) return '';

    if (control.errors['required']) return VALIDATION_MESSAGES.required;
    if (control.errors['email']) return VALIDATION_MESSAGES.email;
    if (control.errors['minlength']) return VALIDATION_MESSAGES.minLength(control.errors['minlength'].requiredLength);

    return '';
  }
}

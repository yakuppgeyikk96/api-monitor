import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ROUTE_PATHS } from '../../../core/constants/routes';
import { VALIDATION_MESSAGES, VALIDATION_RULES } from '../../../shared/constants/validation';
import { Button } from '../../../shared/components/button/button';
import { Input } from '../../../shared/components/input/input';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, Button, Input],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  private fb = inject(FormBuilder);

  protected readonly loginPath = ROUTE_PATHS.auth.loginFull;

  form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(VALIDATION_RULES.password.minLength)]],
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    console.log(this.form.value);
  }

  protected getError(field: 'fullName' | 'email' | 'password'): string {
    const control = this.form.controls[field];
    if (!control.touched || !control.errors) return '';

    if (control.errors['required']) return VALIDATION_MESSAGES.required;
    if (control.errors['email']) return VALIDATION_MESSAGES.email;
    if (control.errors['minlength']) return VALIDATION_MESSAGES.minLength(control.errors['minlength'].requiredLength);

    return '';
  }
}

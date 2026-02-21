import { Component, input } from '@angular/core';

@Component({
  selector: 'app-button',
  templateUrl: './button.html',
})
export class Button {
  label = input.required<string>();
  type = input<'button' | 'submit'>('button');
  variant = input<'primary' | 'secondary'>('primary');
  disabled = input(false);
  loading = input(false);
}

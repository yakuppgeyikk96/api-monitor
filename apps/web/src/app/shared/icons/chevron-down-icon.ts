import { Component, input } from '@angular/core';

@Component({
  selector: 'app-chevron-down-icon',
  template: `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  `,
  styles: `:host { display: inline-flex; }`,
})
export class ChevronDownIcon {
  size = input(24);
}

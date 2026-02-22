import { Component, input, output } from '@angular/core';

import { XIcon } from '../../icons/x-icon';

@Component({
  selector: 'app-dialog',
  imports: [XIcon],
  templateUrl: './dialog.html',
})
export class Dialog {
  open = input(false);
  closed = output<void>();

  onBackdropClick(): void {
    this.closed.emit();
  }

  onPanelClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  onClose(): void {
    this.closed.emit();
  }
}

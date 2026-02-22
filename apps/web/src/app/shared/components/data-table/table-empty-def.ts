import { Directive, inject, TemplateRef } from '@angular/core';

@Directive({
  selector: 'ng-template[tableEmpty]',
})
export class TableEmptyDef {
  readonly templateRef = inject(TemplateRef);
}

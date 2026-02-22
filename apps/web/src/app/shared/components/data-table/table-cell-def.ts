import { Directive, inject, input, TemplateRef } from '@angular/core';

@Directive({
  selector: 'ng-template[tableCellDef]',
})
export class TableCellDef {
  readonly columnKey = input.required<string>({ alias: 'tableCellDef' });
  readonly templateRef = inject(TemplateRef);
}

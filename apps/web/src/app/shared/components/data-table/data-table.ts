import { Component, computed, contentChild, contentChildren, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

import { TableCellDef } from './table-cell-def';
import { TableEmptyDef } from './table-empty-def';
import type { TableColumn } from './table-column';

@Component({
  selector: 'app-data-table',
  imports: [NgTemplateOutlet],
  templateUrl: './data-table.html',
})
export class DataTable<T> {
  readonly columns = input.required<TableColumn[]>();
  readonly data = input.required<T[]>();
  readonly loading = input(false);
  readonly trackBy = input('id');
  readonly emptyText = input('No data');

  protected readonly cellDefs = contentChildren(TableCellDef);
  protected readonly emptyDef = contentChild(TableEmptyDef);

  protected readonly skeletonRows = [1, 2, 3];

  protected readonly cellTemplateMap = computed(() => {
    const map: Record<string, TableCellDef['templateRef']> = {};
    for (const def of this.cellDefs()) {
      map[def.columnKey()] = def.templateRef;
    }
    return map;
  });
}

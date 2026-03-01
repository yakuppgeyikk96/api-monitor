import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { DataTable } from './data-table';
import type { TableColumn } from './table-column';

@Component({
  template: `<app-data-table [columns]="columns" [data]="data" [loading]="loading" />`,
  imports: [DataTable],
})
class TestHost {
  columns: TableColumn[] = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
  ];
  data: any[] = [];
  loading = false;
}

describe('DataTable', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost],
    }).compileComponents();
  });

  it('should show skeleton rows when loading', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.loading = true;
    fixture.detectChanges();

    const skeleton = fixture.nativeElement.querySelector('.animate-pulse');
    expect(skeleton).toBeTruthy();
    expect(fixture.nativeElement.querySelector('table')).toBeNull();
  });

  it('should show empty text when data is empty and not loading', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();

    const emptyText = fixture.nativeElement.querySelector('p');
    expect(emptyText?.textContent).toContain('No data');
    expect(fixture.nativeElement.querySelector('table')).toBeNull();
  });

  it('should render table with headers and rows when data exists', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.data = [
      { id: 1, name: 'Alice', email: 'alice@test.com' },
      { id: 2, name: 'Bob', email: 'bob@test.com' },
    ];
    fixture.detectChanges();

    const headers = fixture.nativeElement.querySelectorAll('th');
    expect(headers.length).toBe(2);
    expect(headers[0].textContent).toContain('Name');
    expect(headers[1].textContent).toContain('Email');

    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
  });
});

import { TestBed } from '@angular/core/testing';
import { Component, viewChild } from '@angular/core';
import { Dialog } from './dialog';

@Component({
  template: `<app-dialog [open]="open" (closed)="onClosed()" />`,
  imports: [Dialog],
})
class TestHost {
  open = false;
  closedCount = 0;
  dialog = viewChild(Dialog);

  onClosed(): void {
    this.closedCount++;
  }
}

describe('Dialog', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost],
    }).compileComponents();
  });

  it('should not render content when closed', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const backdrop = fixture.nativeElement.querySelector('.fixed');
    expect(backdrop).toBeNull();
  });

  it('should render content when open', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.open = true;
    fixture.detectChanges();
    const backdrop = fixture.nativeElement.querySelector('.fixed');
    expect(backdrop).toBeTruthy();
  });

  it('should emit closed on backdrop click', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.open = true;
    fixture.detectChanges();

    const backdrop: HTMLElement = fixture.nativeElement.querySelector('.fixed');
    backdrop.click();

    expect(fixture.componentInstance.closedCount).toBe(1);
  });

  it('should not emit closed on panel click', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.open = true;
    fixture.detectChanges();

    const panel: HTMLElement = fixture.nativeElement.querySelector('.relative');
    panel.click();

    expect(fixture.componentInstance.closedCount).toBe(0);
  });
});

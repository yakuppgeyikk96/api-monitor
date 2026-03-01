import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { Button } from './button';

@Component({
  template: `<app-button [label]="label" [variant]="variant" [disabled]="disabled" [loading]="loading" />`,
  imports: [Button],
})
class TestHost {
  label = 'Click me';
  variant: 'primary' | 'secondary' | 'danger' = 'primary';
  disabled = false;
  loading = false;
}

describe('Button', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost],
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button');
    expect(button).toBeTruthy();
  });

  it('should render the label text', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(button.textContent).toContain('Click me');
  });

  it('should have button type by default', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(button.type).toBe('button');
  });
});

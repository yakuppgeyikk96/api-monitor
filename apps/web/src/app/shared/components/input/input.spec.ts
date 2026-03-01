import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Input } from './input';

@Component({
  template: `<app-input label="Email" [formControl]="control" />`,
  imports: [Input, ReactiveFormsModule],
})
class TestHost {
  control = new FormControl('');
}

describe('Input', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost],
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const inputEl = fixture.nativeElement.querySelector('input');
    expect(inputEl).toBeTruthy();
  });

  it('should reflect form control value via writeValue', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.control.setValue('hello');
    fixture.detectChanges();

    const inputEl: HTMLInputElement = fixture.nativeElement.querySelector('input');
    expect(inputEl.value).toBe('hello');
  });

  it('should propagate input event to form control', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();

    const inputEl: HTMLInputElement = fixture.nativeElement.querySelector('input');
    inputEl.value = 'typed';
    inputEl.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(fixture.componentInstance.control.value).toBe('typed');
  });

  it('should mark control as touched on blur', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();

    expect(fixture.componentInstance.control.touched).toBe(false);

    const inputEl: HTMLInputElement = fixture.nativeElement.querySelector('input');
    inputEl.dispatchEvent(new Event('blur'));

    expect(fixture.componentInstance.control.touched).toBe(true);
  });

  it('should disable the input when form control is disabled', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.control.disable();
    fixture.detectChanges();

    const inputEl: HTMLInputElement = fixture.nativeElement.querySelector('input');
    expect(inputEl.disabled).toBe(true);
  });

  it('should handle null writeValue gracefully', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.control.setValue(null);
    fixture.detectChanges();

    const inputEl: HTMLInputElement = fixture.nativeElement.querySelector('input');
    expect(inputEl.value).toBe('');
  });
});

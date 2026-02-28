import { TestBed } from '@angular/core/testing';
import { SidebarService } from './sidebar';

describe('SidebarService', () => {
  let service: SidebarService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SidebarService);
  });

  it('should start with collapsed as false', () => {
    expect(service.collapsed()).toBe(false);
  });

  it('should start with width as 256px', () => {
    expect(service.width()).toBe('256px');
  });

  it('should toggle collapsed to true', () => {
    service.toggle();
    expect(service.collapsed()).toBe(true);
  });

  it('should update width to 72px when collapsed', () => {
    service.toggle();
    expect(service.width()).toBe('72px');
  });

  it('should toggle back to false on double toggle', () => {
    service.toggle();
    service.toggle();
    expect(service.collapsed()).toBe(false);
    expect(service.width()).toBe('256px');
  });
});

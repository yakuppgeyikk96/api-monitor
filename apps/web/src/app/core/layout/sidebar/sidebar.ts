import { Component, inject, signal, Type } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { SidebarService } from '../../services/sidebar';
import { LayoutDashboardIcon } from '../../../shared/icons/layout-dashboard-icon';
import { Building2Icon } from '../../../shared/icons/building-2-icon';
import { ServerIcon } from '../../../shared/icons/server-icon';
import { RadioTowerIcon } from '../../../shared/icons/radio-tower-icon';
import { PanelLeftCloseIcon } from '../../../shared/icons/panel-left-close-icon';
import { PanelLeftOpenIcon } from '../../../shared/icons/panel-left-open-icon';
import { ChevronDownIcon } from '../../../shared/icons/chevron-down-icon';

interface NavItem {
  label: string;
  path: string;
  icon: Type<unknown>;
  children?: { label: string; path: string }[];
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.html',
  imports: [
    RouterLink,
    RouterLinkActive,
    NgComponentOutlet,
    PanelLeftCloseIcon,
    PanelLeftOpenIcon,
    ChevronDownIcon,
  ],
})
export class Sidebar {
  readonly sidebarService = inject(SidebarService);
  readonly expandedItems = signal(new Set<string>());

  readonly navItems: NavItem[] = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboardIcon },
    { label: 'Workspaces', path: '/workspaces', icon: Building2Icon },
    { label: 'Services', path: '/services', icon: ServerIcon },
    { label: 'Endpoints', path: '/endpoints', icon: RadioTowerIcon },
  ];

  toggleExpand(path: string): void {
    this.expandedItems.update((set) => {
      const next = new Set(set);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }

  isExpanded(path: string): boolean {
    return this.expandedItems().has(path);
  }
}

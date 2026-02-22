import { Component, inject, Type } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { SidebarService } from '../../services/sidebar';
import { LayoutDashboardIcon } from '../../../shared/icons/layout-dashboard-icon';
import { Building2Icon } from '../../../shared/icons/building-2-icon';
import { PanelLeftCloseIcon } from '../../../shared/icons/panel-left-close-icon';
import { PanelLeftOpenIcon } from '../../../shared/icons/panel-left-open-icon';

interface NavItem {
  label: string;
  path: string;
  icon: Type<unknown>;
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
  ],
})
export class Sidebar {
  readonly sidebarService = inject(SidebarService);

  readonly navItems: NavItem[] = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboardIcon },
    { label: 'Workspaces', path: '/workspaces', icon: Building2Icon },
  ];
}

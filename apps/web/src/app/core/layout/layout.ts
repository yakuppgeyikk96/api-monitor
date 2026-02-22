import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { SidebarService } from '../services/sidebar';
import { Sidebar } from './sidebar/sidebar';
import { Navbar } from './navbar/navbar';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
  imports: [RouterOutlet, Sidebar, Navbar],
})
export class Layout {
  readonly sidebarService = inject(SidebarService);
}

import { Component, inject } from '@angular/core';

import { SidebarService } from '../../services/sidebar';
import { CircleUserIcon } from '../../../shared/icons/circle-user-icon';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.html',
  imports: [CircleUserIcon],
})
export class Navbar {
  readonly sidebarService = inject(SidebarService);
}

import { Component } from '@angular/core';
import { SidebarComponent } from '../shared/components/sidebar/sidebar.component';
import { RouterOutlet } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-layout',
  imports: [SidebarComponent, RouterOutlet],
  templateUrl: './layout.component.html',
})
export class LayoutComponent {}

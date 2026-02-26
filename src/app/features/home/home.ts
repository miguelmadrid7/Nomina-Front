import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../../layout/sidebar/sidebar';
import { ThemeSelector } from '../../layout/theme-selector/theme-selector';
import { Header } from '../../layout/header/header';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    Sidebar,
    ThemeSelector,
    Header,
  ],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class Home {

  collapsed = false;

  toggleSidebar() {
    this.collapsed = !this.collapsed;
  }
}

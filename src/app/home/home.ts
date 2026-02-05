import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../core/sidebar/sidebar';
import { ThemeSelector } from '../core/theme-selector/theme-selector';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterOutlet,
    Sidebar,
    ThemeSelector,
  ],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {

}

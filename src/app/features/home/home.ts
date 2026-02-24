import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../../layout/sidebar/sidebar';
import { ThemeSelector } from '../../layout/theme-selector/theme-selector';

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

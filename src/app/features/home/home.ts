import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../../layout/sidebar/sidebar';
import { ThemeSelector } from '../../layout/theme-selector/theme-selector';
import { Header } from '../../layout/header/header';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterOutlet,
    Sidebar,
    ThemeSelector,
    Header,
  ],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {

}

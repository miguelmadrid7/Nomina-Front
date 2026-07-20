import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GlobalLoader } from './shared/global-loader/global-loader';
import { ToastComponent } from "./shared/toast/toast.component";
import { ToastContainer } from "./shared/toast-container/toast-container";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    GlobalLoader,
    ToastContainer
],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('curso');
}

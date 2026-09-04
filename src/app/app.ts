import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GlobalLoader } from './shared/global-loader/global-loader';
import { ToastContainer } from "./shared/toast-container/toast-container";
import { PayrollJobService } from './core/services/payroll.service';

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
  private readonly payrollJobService = inject(PayrollJobService);
  protected readonly title = signal('curso');
}

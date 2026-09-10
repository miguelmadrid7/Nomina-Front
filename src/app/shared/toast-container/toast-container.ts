import { Component, inject } from '@angular/core';
import { ToastService } from '../../core/services/toast.service';
import { CommonModule } from '@angular/common';
import { ToastComponent } from '../toast/toast.component';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [
    CommonModule,
    ToastComponent
  ],
  templateUrl: './toast-container.html',
  styleUrl: './toast-container.css'
})
export class ToastContainer {

  private readonly toastService = inject(ToastService);
  readonly toasts = this.toastService.toasts;

  removeToast(id: number): void {
    this.toastService.remove(id);
  }

}

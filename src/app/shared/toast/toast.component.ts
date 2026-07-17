import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule
  ],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.css'
})
export class ToastComponent {
  @Input() type: 'success' | 'info' | 'warning' | 'error' = 'info';
  @Input() title = '';
  @Input() message = '';
  @Output() closed = new EventEmitter<void>();

  close(): void {
    this.closed.emit();
  }

}

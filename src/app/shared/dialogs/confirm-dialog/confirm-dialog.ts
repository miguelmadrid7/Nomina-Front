import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [
    CommonModule, 
    MatDialogModule,
    MatIconModule,
  ],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.css'
})
export class ConfirmDialog {
  constructor(
    private ref: MatDialogRef<ConfirmDialog>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      title?: string;
      message?: string;
      confirmText?: string;
      cancelText?: string;
      type?: 'danger' | 'info';
    }
  ) {}

  cancel(): void {
    this.ref.close(false);
  }

  confirm(): void {
    this.ref.close(true);
  }

  cerrar(): void {
    this.ref.close();
  }
}

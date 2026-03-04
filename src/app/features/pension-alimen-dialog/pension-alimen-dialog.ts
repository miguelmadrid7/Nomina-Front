import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-pension-alimen-dialog',
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  standalone: true,
  templateUrl: './pension-alimen-dialog.html',
  styleUrl: './pension-alimen-dialog.css'
})
export class PensionAlimenDialog {

   constructor(
    private ref: MatDialogRef<PensionAlimenDialog>,
    @Inject(MAT_DIALOG_DATA) public data: { title?: string; message?: string; type?: 'success'|'error'|'info' }
  ) {}
  close() { this.ref.close(); }

}

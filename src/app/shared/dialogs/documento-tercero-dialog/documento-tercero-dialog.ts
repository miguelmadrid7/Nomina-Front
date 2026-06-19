import { Component, inject, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-documento-tercero-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatDialogModule,
    MatCardModule,
  ],
  templateUrl: './documento-tercero-dialog.html',
  styleUrl: './documento-tercero-dialog.css'
})
export class DocumentoTerceroDialog {

  private readonly dialogRef = inject( MatDialogRef<DocumentoTerceroDialog>);
  readonly data = inject<any>(MAT_DIALOG_DATA);


  close() {
    this.dialogRef.close();
  }

  download(documento: any) {
    this.dialogRef.close({ action: 'download', documentoId: documento.id });
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
  }

}

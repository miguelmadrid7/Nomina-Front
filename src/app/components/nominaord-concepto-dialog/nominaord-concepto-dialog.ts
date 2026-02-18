import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-nominaord-concepto-dialog',
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatTableModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    ],
  templateUrl: './nominaord-concepto-dialog.html',
  styleUrl: './nominaord-concepto-dialog.css'
})
export class NominaordConceptoDialog {
  cols = ['tipoConcepto','concepto','noComprobante', 'importe',];
  name = '';
  totalImporte = 0;

  constructor(
  @Inject(MAT_DIALOG_DATA) public data: {
    empleadoId?: number;
    nombreEmpleado: string;
    curp: string;
    rfc: string;
    qnaTexto: string;
    detalles: Array<{
      noComprobante: number|string;
      tipoConcepto: string;
      concepto: string;
      importe: number;
    }>
  },
  private ref: MatDialogRef<NominaordConceptoDialog>
) {
  this.totalImporte = (data.detalles ?? [])
    .reduce((acc, c) => acc + (Number(c.importe) || 0), 0);
}


    close(){
      this.ref.close();
    }

}

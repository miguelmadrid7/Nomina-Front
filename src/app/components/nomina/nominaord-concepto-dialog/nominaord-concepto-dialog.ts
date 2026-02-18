import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatRadioModule } from '@angular/material/radio';

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
    MatRadioModule
  ],
  templateUrl: './nominaord-concepto-dialog.html',
  styleUrls: ['./nominaord-concepto-dialog.css']
})
export class NominaordConceptoDialog {
  cols = ['tipoConcepto','concepto','noComprobante','importe'];
  noComprobanteCab: string | number = '—';
  totalImporte = 0;
  totalPercepciones = 0;
  totalDeducciones = 0;
  liquido = 0;
  selectedView: 'ambas' | 'percepciones' | 'deducciones' = 'ambas';

  percepciones: Array<{ tipo: string; concepto: string; importe: number }> = [];
  deducciones: Array<{ tipo: string; concepto: string; importe: number }> = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {
      empleadoId?: number;
      nombreEmpleado: string;
      curp: string;
      rfc: string;
      qnaTexto: string;
      detalles: Array<{
        noComprobante: number|string;
        tipoConcepto: string; // "P - percepcion" o "D - deduccion"
        concepto: string;
        importe: number;
      }>;
    },
    private ref: MatDialogRef<NominaordConceptoDialog>
  ) {
    const det = data.detalles ?? [];
    const tipo = (v: string) => (v || '').trim().toUpperCase().charAt(0); // 'P' o 'D'

    this.percepciones = det
      .filter(d => tipo(d.tipoConcepto) === 'P')
      .map(d => ({ tipo: 'P', concepto: d.concepto, importe: Number(d.importe) || 0 }));

    this.deducciones = det
      .filter(d => tipo(d.tipoConcepto) === 'D')
      .map(d => ({ tipo: 'D', concepto: d.concepto, importe: Number(d.importe) || 0 }));

    this.totalPercepciones = this.percepciones.reduce((a, c) => a + c.importe, 0);
    this.totalDeducciones = this.deducciones.reduce((a, c) => a + c.importe, 0);
    this.liquido = this.totalPercepciones - this.totalDeducciones;

    this.totalImporte = det.reduce((acc, d) => acc + (Number(d.importe) || 0), 0);
    this.noComprobanteCab = (data as any).noComprobante ?? det?.[0]?.noComprobante ?? '—';
  }

  close(){
    this.ref.close();
  }
}

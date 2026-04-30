import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule, MatOptionModule } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-dialog-tercero-institucional',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatOptionModule,
    MatInputModule,
    MatSelectModule,
    MatNativeDateModule,

  ],
  templateUrl: './dialog-tercero-institucional.html',
  styleUrl: './dialog-tercero-institucional.css'
})
export class DialogTerceroInstitucional {

  form!: FormGroup;
  tipoOrdenOptions = [{ label: 'Alta', value: 1 }, { label: 'Baja', value: 2 },];

  constructor(private fb: FormBuilder, private ref: MatDialogRef<DialogTerceroInstitucional>, @Inject(MAT_DIALOG_DATA) public data: any) {}

  ngOnInit() {
    const currentQna = this.getCurrentQna();
    this.form = this.fb.group({
      apellidoPaterno: [''],
      apellidoMaterno: [''],
      nombres: [''],
      rfc: [''],
      tipoOrden: [null],
      concepto: [null], 
      qnaDesde: [''],
      qnaHasta: [''],
      importeMensual: [null],
    });
    this.form.patchValue({
      apellidoPaterno: this.data?.apellidoPaterno ?? '',
      apellidoMaterno: this.data?.apellidoMaterno ?? '',
      nombres: this.data?.nombres ?? '',
      rfc: this.data?.rfc ?? '',
      tipoOrden: this.data?.tipoOrden ?? null,
      concepto: this.data?.concepto ?? null,
      qnaDesde: this.data?.qnaDesde ?? currentQna.aaaaqq,
      qnaHasta: this.data?.qnaHasta ?? '',
      importeMensual: this.data?.importeMensual ?? null,
    }, 
    { emitEvent: false });
  }

  private getCurrentQna(): { anio: number; qna: number; aaaaqq: number } {
    const now = new Date();
    const anio = now.getFullYear();
    const mes = now.getMonth() + 1;
    const qnaDelMes = (now.getDate() <= 15) ? 1 : 2;
    const qna = (mes - 1) * 2 + qnaDelMes;
    return { anio, qna, aaaaqq: anio * 100 + qna };
  }

  guardar() {
  if (this.form.invalid) {
    console.log('Form inválido');
    this.form.markAllAsTouched();
    return;
  }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const conceptoObj = v.concepto;
    const qnaProceso = Number(v.qnaDesde);
    const nombreTrabajador = [
      v.apellidoPaterno,
      v.apellidoMaterno,
      v.nombres
    ].map(x => (x ?? '').trim()).filter(Boolean).join(' ');

    const payload: any = {
      rfc: v.rfc,
      nombreTrabajador,
      apellidoPaterno: v.apellidoPaterno,
      apellidoMaterno: v.apellidoMaterno,
      nombres: v.nombres,
      tipoOrden: v.tipoOrden,
      concepto: (conceptoObj?.cve ?? null) ? String(conceptoObj.cve).trim().toLowerCase() : null,
      qnaProceso,   
      qnaIni: Number(v.qnaDesde),
      qnaFin: Number(v.qnaHasta),
      importeMensual: Number(v.importeMensual),
      detalles: this.data?.detalles ?? []
    };
    this.ref.close(payload);
  }

  cerrar() {
    this.ref.close();
  }

}

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
  tipoOrdenOptions = ['Alta', 'Baja'];

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
    
  }

  cerrar() {
    this.ref.close();
  }

}

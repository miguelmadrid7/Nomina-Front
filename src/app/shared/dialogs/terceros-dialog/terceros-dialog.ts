import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatOption, MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { qnaMinimaValidator, qnaRangoValidator } from '../../validators/validaciones.validators';

@Component({
  selector: 'app-terceros-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatOption,
    MatIconModule,
  ],
  templateUrl: './terceros-dialog.html',
  styleUrl: './terceros-dialog.css'
})
export class TercerosDialog {

  form!: FormGroup;

  estatusOptions = ['Registrado', 'Pendiente', 'Aprobado'];
  tipoOrdenOptions = ['Alta', 'Baja', 'Cambio'];

  constructor(
    private fb: FormBuilder,
    private ref: MatDialogRef<TercerosDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    const currentQna = this.getCurrentQna();
    const minQna = this.nextQna(currentQna.aaaaqq).aaaaqq;

    this.form = this.fb.group({
      rfc: [this.data.rfc],
      curp: [this.data.curp],
      apellidoPaterno: [this.data.apellidoPaterno],
      apellidoMaterno: [this.data.apellidoMaterno],
      nombres: [this.data.nombres],
      numeroDocumento: [this.data.numeroDocumento],
      tipoOrden: [this.data.tipoOrden],
      importeMensual: [this.data.importeMensual],
      qnaDesde: [currentQna.aaaaqq],
      qnaHasta: [''],
      estatus: [this.data.estatus]
    },
    {
      validators: [
        qnaMinimaValidator(minQna),
        qnaRangoValidator()
      ]
    });

    this.form.get('tipoOrden')?.valueChanges.subscribe((valor) => {
      if (valor === 'Alta') {
        this.form.get('estatus')?.setValue('Registrado');
        this.form.get('estatus')?.disable(); 
      } else {
        this.form.get('estatus')?.enable(); 
      }
    });
  }

  getCurrentQna(): { anio: number; qna: number; aaaaqq: number } {
    const now = new Date();
    const anio = now.getFullYear();
    const mes = now.getMonth() + 1;
    const qnaDelMes = (now.getDate() <= 15) ? 1 : 2;
    const qna = (mes - 1) * 2 + qnaDelMes;
    return { anio, qna, aaaaqq: anio * 100 + qna };
  }

  nextQna(aaaaqq: number): { anio: number; qna: number; aaaaqq: number } {
    let anio = Math.floor(aaaaqq / 100);
    let qna = aaaaqq % 100;
    qna += 1;
    if (qna > 24) {
      qna = 1;
      anio += 1;
    }
    return { anio, qna, aaaaqq: anio * 100 + qna };
  }

  guardar() {
    console.log(this.form.value);
    this.ref.close(this.form.value);
  }

  cerrar() {
    this.ref.close();
  }
}
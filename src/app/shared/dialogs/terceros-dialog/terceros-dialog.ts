import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatOption, MatSelectModule } from '@angular/material/select';
import { MatNativeDateModule, MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { qnaMinimaValidator, qnaRangoValidator } from '../../validators/validaciones.validators';
import flatpickr from 'flatpickr';

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
    MatDatepickerModule,
    MatNativeDateModule      


  ],
  templateUrl: './terceros-dialog.html',
  styleUrl: './terceros-dialog.css'
})
export class TercerosDialog  {

  form!: FormGroup;

  estatusOptions = ['Registrado', 'Pendiente', 'Aprobado'];
  tipoOrdenOptions = ['Alta', 'Baja', 'Cambio'];
  esAltaFlag = false;

  constructor(
    private fb: FormBuilder,
    private ref: MatDialogRef<TercerosDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    const currentQna = this.getCurrentQna();
    const minQna = this.nextQna(currentQna.aaaaqq).aaaaqq;
    const now = new Date();
    const horaActual = now.toTimeString().slice(0, 5);

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
      estatus: [this.data.estatus],
      fechaRegistro: [{ value: this.data.fechaRegistro || new Date(), disabled: true }],
    },
    {
      validators: [
        qnaMinimaValidator(minQna),
        qnaRangoValidator()
      ]
    });

    this.form.get('tipoOrden')?.valueChanges.subscribe((valor) => {
      this.esAltaFlag = valor?.toLowerCase() === 'alta';
      if (valor === 'Alta') {
        this.form.get('estatus')?.setValue('Registrado');
        this.form.get('estatus')?.disable(); 
      } else {
        this.form.get('estatus')?.enable(); 
      }
    });

    const inicial = this.form.get('tipoOrden')?.value;
    this.esAltaFlag = inicial?.toLowerCase() === 'alta';
  }

  ngAfterViewInit() {
  flatpickr('#fechaHoraInput', {
    enableTime: true,
    dateFormat: 'Y-m-d H:i',
    defaultDate: new Date(),
    time_24hr: true
  });
}

  get esAlta(): boolean {
    const valor = this.form?.get('tipoOrden')?.value;
    return valor?.toLowerCase() === 'alta';
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
    const value = this.form.getRawValue();

    // Flatpickr ya devuelve fecha completa
    const fecha = new Date(value.fechaRegistro);
    value.fechaRegistro = fecha.toISOString();

    this.ref.close(value);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleString();
  }

  cerrar() {
    this.ref.close();
  }
}
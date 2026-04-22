import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatOption, MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';

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

  form: FormGroup;

  estatusOptions = ['Registrado', 'Pendiente', 'Aprobado'];
  tipoOrdenOptions = ['Alta', 'Baja', 'Cambio'];

  constructor(
    private fb: FormBuilder,
    private ref: MatDialogRef<TercerosDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.form = this.fb.group({
      rfc: [data.rfc],
      curp: [data.curp],
      apellidoPaterno: [data.apellidoPaterno],      // ← Agregado
      apellidoMaterno: [data.apellidoMaterno],      // ← Agregado
      nombres: [data.nombres],                     // ← Corregido de 'nombreEmpleado'
      numeroDocumento: [data.numeroDocumento],
      tipoOrden: [data.tipoOrden],
      importeMensual: [data.importeMensual],
      qnaDesde: [''],
      qnaHasta: [''],
      estatus: [data.estatus]
    });
  }

  guardar() {
    console.log(this.form.value);
    this.ref.close(this.form.value);
  }

  cerrar() {
    this.ref.close();
  }
}
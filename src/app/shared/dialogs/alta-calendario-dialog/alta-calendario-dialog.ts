import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Calendario } from '../../../models/calendario.model';

@Component({
  selector: 'app-alta-calendario-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './alta-calendario-dialog.html',
  styleUrl: './alta-calendario-dialog.css'
})
export class AltaCalendarioDialog {

  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<AltaCalendarioDialog>);
  private readonly calendario = inject<Calendario | null>(MAT_DIALOG_DATA);

  form = this.fb.group({
    ejercicio: [this.calendario?.ejercicio ?? null, Validators.required],
    qna: [this.calendario?.qna ?? null, Validators.required],
    tipo: [this.calendario?.tipo ?? '', Validators.required],
    fechaCierre: [this.calendario?.fechaCierre ? new Date(this.calendario.fechaCierre) : null, Validators.required],
    fechaPago: [this.calendario?.fechaPago ? new Date(this.calendario.fechaPago)   : null, Validators.required],
    movimientos: [this.calendario?.movimientos ?? false],
    pension: [this.calendario?.pension ?? false],
    juicios: [this.calendario?.juicios ?? false],
    terceros: [this.calendario?.terceros ?? false],
    activa: [this.calendario?.activa ?? false],
  });

  save(): void {
    if (this.form.invalid) return;
    const v = this.form.value;
    this.dialogRef.close({
      ejercicio: v.ejercicio,
      qna: v.qna,
      tipo: v.tipo,
      fechaCierre: v.fechaCierre instanceof Date ? v.fechaCierre.toISOString().split('T')[0] : v.fechaCierre,
      fechaPago: v.fechaPago instanceof Date ? v.fechaPago.toISOString().split('T')[0] : v.fechaPago,
      movimientos: v.movimientos ?? false,
      pension: v.pension ?? false,
      juicios: v.juicios ?? false,
      terceros: v.terceros ?? false,
      activa: v.activa ?? false,
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }

}

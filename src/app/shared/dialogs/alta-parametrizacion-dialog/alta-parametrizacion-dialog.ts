import { CommonModule } from '@angular/common';
import { Component, inject, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ParametrizacionService } from '../../../core/services/parametrizacion.service';
import { DialogData } from '../../../models/dialogdata.model';
import { ParametrizacionRequest } from '../../../models/request/parametrizacion-request.model';
import { PensionAlimenDialog } from '../../../features/pension-alimenticia/pension-alimen-dialog/pension-alimen-dialog';
import { ConfirmDialog } from '../confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-alta-parametrizacion-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,

  ],
  templateUrl: './alta-parametrizacion-dialog.html',
  styleUrl: './alta-parametrizacion-dialog.css'
})
export class AltaParametrizacionDialog implements OnInit {

  isLoading  = false;

  private readonly dialogRef = inject(MatDialogRef<AltaParametrizacionDialog>);
  private readonly parametrizacionService = inject(ParametrizacionService);
  private readonly dialog = inject(MatDialog);
  private readonly fb = inject(FormBuilder);
  readonly data = inject<DialogData>(MAT_DIALOG_DATA);

  readonly form = this.fb.group({
    anio: [null as number | null, Validators.required],
    importeDiario: [null as number | null, Validators.required],
    importeMensual: [null as number | null, Validators.required],
    qnaInicio:  [null as number | null, Validators.required],
    qnaFin: [null as number | null, Validators.required],
  });


  get mode(): 'create' | 'update'{ return this.data.mode; }
  get isEdit(): boolean { return this.data.mode === 'update'; }
  get anioControl() { return this.form.controls.anio; }
  get importeDiarioControl()  { return this.form.controls.importeDiario; }
  get importeMensualControl() { return this.form.controls.importeMensual; }
  get qnaInicioControl() { return this.form.controls.qnaInicio; }
  get qnaFinControl() { return this.form.controls.qnaFin; }

  ngOnInit(): void {
    if (this.isEdit && this.data.param) {
      this.form.patchValue({
        anio: this.data.param.anio,
        importeDiario: this.data.param.importeDiario,
        importeMensual: this.data.param.importeMensual,
        qnaInicio: this.data.param.qnaInicio,
        qnaFin: this.data.param.qnaFin,
      });
    }
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading  = true;
    const raw = this.form.getRawValue(); 
      const payload: ParametrizacionRequest = {
        anio: raw.anio!,
        importeDiario: raw.importeDiario!,
        importeMensual: raw.importeMensual!,
        qnaInicio: raw.qnaInicio!,
        qnaFin: raw.qnaFin!,
      };
      const llamada = this.isEdit 
      ? this.parametrizacionService.updateParam(this.data.param!.id, payload)  
      : this.parametrizacionService.createParam(payload);

    llamada.subscribe({
      next: () => {
        this.isLoading = false;
        this.dialog.open(ConfirmDialog, {
          width: '360px',
          data: {
            title: 'Operación exitosa',
            message: this.isEdit
              ? 'Se actualizó correctamente el registro.'
              : 'Se guardó correctamente el registro.',
            confirmText: 'Aceptar'
          }
        }).afterClosed().subscribe(() => this.dialogRef.close(true));
      },
      error: () => {
        this.isLoading  = false;
        this.dialog.open(ConfirmDialog, {
          width: '360px',
          data: {
            title: 'Error',
            message: 'Ocurrió un error al guardar. Intenta de nuevo.',
            confirmText: 'Aceptar',
            type: 'error'
          }
        });
      }
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}

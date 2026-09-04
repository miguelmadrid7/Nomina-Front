import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ParametrizacionService } from '../../../core/services/parametrizacion.service';
import { DialogData } from '../../../core/model/dialogdata.model';
import { ParametrizacionRequest } from '../../../core/model/request/parametrizacion-request.model';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-alta-parametrizacion-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,

  ],
  templateUrl: './alta-parametrizacion-dialog.html',
  styleUrl: './alta-parametrizacion-dialog.css'
})
export class AltaParametrizacionDialog implements OnInit {

  isLoading  = false;

  private readonly dialogRef = inject(MatDialogRef<AltaParametrizacionDialog>);
  private readonly parametrizacionService = inject(ParametrizacionService);
  private readonly fb = inject(FormBuilder);
  private readonly toastService = inject(ToastService);

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
        this.toastService.info('Operación exitosa', this.isEdit ? 'Se actualizó correctamente el registro.' : 'Se guardó correctamente el registro.', 6000);
        this.dialogRef.close(true);
      },
      error: () => {
        this.isLoading  = false;
        this.toastService.error('Operacion invalida', 'Ocurrió un erro al guardar. Intenta nuevamente', 6000);
      }
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}

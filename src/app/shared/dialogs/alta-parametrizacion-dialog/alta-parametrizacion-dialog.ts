import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ParametrizacionService } from '../../../core/services/parametrizacion.service';
import { DialogData } from '../../../models/dialogdata.model';
import { ParametrizacionRequest } from '../../../models/request/parametrizacion-request.model';
import { PensionAlimenDialog } from '../../../features/pension-alimenticia/pension-alimen-dialog/pension-alimen-dialog';

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

  form!: FormGroup;
  guardando = false;

  constructor(private dialogRef: MatDialogRef<AltaParametrizacionDialog>,  
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
     private fb: FormBuilder, 
     private parametrizacionService:  ParametrizacionService, private dialog: MatDialog){}

  get mode(): 'create' | 'update'{
    return this.data.mode;
  }

  get isEdit(): boolean {
    return this.data.mode === 'update';
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      anio: [''],
      importeDiario: [''],
      importeMensual: [''],
      qnaInicio: [''], 
      qnaFin: ['']
    });

    if (this.isEdit && this.data.param) {
      this.form.patchValue({
        anio: this.data.param.anio,
        importeDiario: this.data.param.importeDiario,   
        importeMensual: this.data.param.importeMensual,  
        qnaInicio: this.data.param.qnaInicio,       
        qnaFin: this.data.param.qnaFin           
      });
    }
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando = true;
    const payload: ParametrizacionRequest = this.form.value;
    const llamada = this.isEdit ? this.parametrizacionService.updateParam(this.data.param.id, payload)  : this.parametrizacionService.createParam(payload);
    llamada.subscribe({
      next: () => {
        this.guardando = false;
        this.dialog.open(PensionAlimenDialog, {
          width: '360px',
          data: {
            title: 'Éxito',
            message: this.isEdit
              ? 'Se actualizó correctamente el registro.'
              : 'Se guardó correctamente el registro.',
            type: 'success'
          }
        }).afterClosed().subscribe(() => {
          this.dialogRef.close(true); 
        });
      },
      error: (err: any) => {
        console.error('Error al guardar', err);
        this.guardando = false;
        this.dialog.open(PensionAlimenDialog, {
          width: '360px',
          data: {
            title: 'Error',
            message: 'Ocurrió un error al guardar. Intenta de nuevo.',
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

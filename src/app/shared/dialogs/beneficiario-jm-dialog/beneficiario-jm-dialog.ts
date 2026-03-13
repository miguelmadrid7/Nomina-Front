import { CommonModule } from '@angular/common';
import { Component, Inject, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Banco } from '../../../models/banco.model';
import { JuiciosMercantilesService } from '../../../core/services/juicios-mercantiles.services';
import { MatSnackBar } from '@angular/material/snack-bar';
import { factorImporteValidator, vigenciaRangoValidator } from '../../validators/juicios.validators';
import { factorImporteControlValidator, rfcValidator } from '../../../shared/validators/validaciones.validators';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { vigenciaFormatoValidator } from '../../validators/validaciones.validators';
import { SoloLetrasDirectiva } from '../../directives/solo-letras.directivas';

@Component({
  selector: 'app-beneficiario-jm-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatCardModule,
    MatSelectModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    SoloLetrasDirectiva
  ],
  templateUrl: './beneficiario-jm-dialog.html',
  styleUrl: './beneficiario-jm-dialog.css'
})
export class BeneficiarioJmDialog {

  form!: FormGroup;
  bancos: Banco[] = [];

  constructor(
    private fb: FormBuilder,
    private juiciosMercantilesService: JuiciosMercantilesService,
    private snackBar: MatSnackBar,
    private zone: NgZone,
    private dialogRef: MatDialogRef<BeneficiarioJmDialog>,
    @Inject(MAT_DIALOG_DATA) public data: { empleadoId: number; bancos: Banco[] }
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      beneficiario: this.fb.group({
        rfc: [null, [rfcValidator()]],                    // sin required
        primerApellido: [null, [Validators.minLength(2)]],
        segundoApellido: [null, [Validators.minLength(2)]],
        nombre: [null, [Validators.minLength(2)]],
      }),
      descuento: this.fb.group({
        formaAplicacion: [null],                          // sin required
        factorImporte: [null, [factorImporteControlValidator()]], // tu validador ya ignora null
        bancoId: [null],                                  // sin required
        clabe: [null, [Validators.pattern(/^\d{18}$/)]],
        importeTotal: [null, [Validators.min(0)]],
        citaBancaria: [null],
      }),
      vigencia: this.fb.group({
        inicio: [null, [vigenciaFormatoValidator()]],     // tu validador ya ignora null
        fin: [null, [vigenciaFormatoValidator()]],
      })
    },
    { validators: [factorImporteValidator(), vigenciaRangoValidator()] });
  }
  


  private showSnack(message: string, action: string, duration: number): void {
    this.zone.runOutsideAngular(() => {
      setTimeout(() => {
        this.zone.run(() => this.snackBar.open(message, action, { duration }));
      }, 50);
    });
  }

  private buildPayload() {
    const fv = this.form.value;
    return {
      tabEmpleadosId: this.data.empleadoId,
      formaAplicacion: fv.descuento?.formaAplicacion,
      factorImporte: fv.descuento?.factorImporte,
      numeroDocumento: fv.descuento?.citaBancaria,
      qnaini: Number(fv.vigencia?.inicio),
      qnafin: Number(fv.vigencia?.fin),
      tabBeneficiariosJmId: this.data.empleadoId,
      numeroBenef: 1
    };
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.showSnack('Formulario inválido', 'Cerrar', 4000);
      return;
    }
    const payload = this.buildPayload();
    this.juiciosMercantilesService.agregarBeneficiario(payload).subscribe({
      next: () => {
        this.showSnack('Beneficiario guardado correctamente', 'Cerrar', 4000);
        this.cerrar();
      },
      error: () => {
        this.showSnack('Error al guardar beneficiario', 'Cerrar', 4000);
      }
    });
  }

  cancelar(): void {
  // Cierra el diálogo devolviendo un resultado "cancelado"
  this.dialogRef.close({ cancelled: true });
}

  cerrar(): void {
    this.dialogRef.close(true);
  }
}
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
import { factorImporteControlValidator, rfcValidator, vigenciaMinimaValidator } from '../../../shared/validators/validaciones.validators';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { vigenciaFormatoValidator } from '../../validators/validaciones.validators';
import { SoloLetrasDirectiva } from '../../directives/solo-letras.directivas';
import { BeneficiarioJMRequest } from '../../../models/beneficiario-jm-request.model';

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
      empleado : this.fb.group({
        rfc: [null, [rfcValidator()]],                    // sin required
        primerApellido: [null, [Validators.minLength(2)]],
        segundoApellido: [null, [Validators.minLength(2)]],
        nombre: [null, [Validators.minLength(2)]],
      }),
      beneficiario: this.fb.group({
        tabBeneficiariosJmId: [null],
        rfc: [null, [rfcValidator()]],
        primerApellido: [null, [Validators.minLength(2)]],
        segundoApellido: [null, [Validators.minLength(2)]],
        nombre: [null, [Validators.minLength(2)]],
        formaAplicacion: [null],
        factorImporte: [null, [factorImporteControlValidator()]],
        bancoId: [null],
        clabe: [null, [Validators.pattern(/^\d{18}$/)]],
        importeTotal: [null, [Validators.min(0)]],
        citaBancaria: [null],
        inicio: [null, [vigenciaFormatoValidator()]],
        fin: [null, [vigenciaFormatoValidator()]],
      })
    },
    { validators: [factorImporteValidator(), vigenciaRangoValidator()] });
    this.bancos = this.data?.bancos ?? [];
    
    const curr = this.getCurrentQna();
    const minObj = this.nextQna(curr.aaaaqq);
    const minAaaaqq = minObj.aaaaqq;
    this.form.patchValue({
      beneficiario: {
        inicio: String(minAaaaqq)
      }
    }, { emitEvent: false });
    const beneficiarioGroup = this.form.get('beneficiario');
    if (beneficiarioGroup) {
      beneficiarioGroup.addValidators(vigenciaMinimaValidator(minAaaaqq));
      beneficiarioGroup.updateValueAndValidity({ emitEvent: false });
    }
  }
  
  private showSnack(message: string, action: string, duration: number): void {
    this.zone.runOutsideAngular(() => {
      setTimeout(() => {
        this.zone.run(() => this.snackBar.open(message, action, { duration }));
      }, 50);
    });
  }

  private buildPayload() {
    const v = this.form.value.beneficiario ?? {};
    return {
      tabBeneficiariosJmId: this.data.empleadoId,
      rfc: v.rfc ?? null,
      primerApellido: v.primerApellido ?? null,
      segundoApellido: v.segundoApellido ?? null,
      nombre: v.nombre ?? null,
      tabEmpleadosId: this.data.empleadoId,
      formaAplicacion: v.formaAplicacion ?? null,
      factorImporte: v.factorImporte ?? null,
      numeroDocumento: v.citaBancaria ?? null,
      qnaini: v.inicio != null ? Number(v.inicio) : null,
      qnafin: v.fin != null ? Number(v.fin) : null,
      numeroBenef: 1
    };
  }

  guardar(): void {
    console.log('FORM STATUS:', this.form.status);
    console.log('FORM ERRORS:', this.form.errors);
    console.log('BENEFICIARIO ERRORS:', this.form.get('beneficiario')?.errors);
    console.log('FORM VALUE:', this.form.value);
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

  getCurrentQna(): { anio: number; qna: number; aaaaqq: number } {
    const now = new Date();
    const anio = now.getFullYear();
    const mes = now.getMonth() + 1; // 1..12
    const qnaDelMes = (now.getDate() <= 15) ? 1 : 2;   // 1a o 2a quincena del mes
    const qna = (mes - 1) * 2 + qnaDelMes;            // 1..24
    return { anio, qna, aaaaqq: anio * 100 + qna };
  }

  nextQna(aaaaqq: number): { anio: number; qna: number; aaaaqq: number } {
  let anio = Math.floor(aaaaqq / 100);
  let qna = aaaaqq % 100;  // 1..24
  qna += 1;
  if (qna > 24) { qna = 1; anio += 1; }
  return { anio, qna, aaaaqq: anio * 100 + qna };
  } 

  cancelar(): void {
    this.dialogRef.close({ cancelled: true });
  }

  cerrar(): void {
    this.dialogRef.close(true);
  }
}
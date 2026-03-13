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
import { rfcValidator } from '../../../shared/validators/validaciones.validators';
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
        rfc: ['', [Validators.required, rfcValidator()]],
        primerApellido: ['', [Validators.required, Validators.minLength(2)]],
        segundoApellido: ['', [Validators.required, Validators.minLength(2)]],
        nombre: ['', [Validators.required, Validators.minLength(2)]],
      }),
      descuento: this.fb.group({
        formaAplicacion: ['', [Validators.required]],
        factorImporte: [null], // ver condicional abajo
        bancoId: [null, [Validators.required]],
        clabe: ['', [Validators.required, Validators.pattern(/^\d{18}$/)]],
        importeTotal: [null, [Validators.required, Validators.min(0)]],
        citaBancaria: ['', [Validators.required]],
      }),
      vigencia: this.fb.group({
        inicio: ['', [Validators.required, vigenciaFormatoValidator()]],
        fin: ['', [Validators.required, vigenciaFormatoValidator()]],
      })
    },
    { validators: [factorImporteValidator(), vigenciaRangoValidator()] });

      const formaCtrl = this.form.get('descuento.formaAplicacion');
      const factorCtrl = this.form.get('descuento.factorImporte');
      formaCtrl?.valueChanges.subscribe(v => {
        if (v === 'P') {
          // Porcentaje: 0–100, solo enteros de hasta 3 dígitos
          factorCtrl?.setValidators([
            Validators.required,
            Validators.pattern(/^\d{1,3}$/),
            Validators.min(0),
            Validators.max(100),
          ]);
        } else if (v === 'C') {
          // Importe: solo positivos o cero
          factorCtrl?.setValidators([
            Validators.required,
            Validators.min(0),
          ]);
        } else {
          factorCtrl?.clearValidators();
        }
        factorCtrl?.updateValueAndValidity({ emitEvent: false });
      });
      this.bancos = this.data?.bancos ?? [];

      const toUpper = (path: string) => {
      const ctrl = this.form.get(path);
        ctrl?.valueChanges.subscribe(v => {
          if (typeof v === 'string' && v !== v.toUpperCase()) {
            ctrl.setValue(v.toUpperCase(), { emitEvent: false });
          }
        });
      };
      [
        'beneficiario.rfc',
        'beneficiario.primerApellido',
        'beneficiario.segundoApellido',
        'beneficiario.nombre',
        'descuento.citaBancaria'
      ].forEach(toUpper);
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

  cerrar(): void {
    this.dialogRef.close(true);
  }
}
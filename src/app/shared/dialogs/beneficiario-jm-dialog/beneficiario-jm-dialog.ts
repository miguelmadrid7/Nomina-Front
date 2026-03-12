import { CommonModule } from '@angular/common';
import { Component, Inject, NgZone, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { Banco } from '../../../models/banco.model';
import { JuiciosMercantilesService } from '../../../core/services/juicios-mercantiles.services';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BeneficiarioJMRequest } from '../../../models/beneficiario-jm-request.model';
import { factorImporteValidator, rfcValidator, vigenciaRangoValidator } from '../../validators/juicios.validators';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { vigenciaFormatoValidator } from '../../validators/validaciones.validators';
import { SoloLetrasDirectiva } from '../../directives/validaciones.directivas';

@Component({
  selector: 'app-beneficiario-jm-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatAutocompleteModule,
    MatCardModule,
    MatSelectModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    SoloLetrasDirectiva
  ],
  templateUrl: './beneficiario-jm-dialog.html',
  styleUrl: './beneficiario-jm-dialog.css'
})
export class BeneficiarioJmDialog {


  @ViewChild(MatAutocompleteTrigger) autocompleteTrigger?: MatAutocompleteTrigger;

  form!: FormGroup;
  bancos: Banco[] = [];
  resultado: BeneficiarioJMRequest[] = [];

  vigenciaInicio: string = '';
  vigenciaFin: string = '';
  factorImporte: number | null = null;
  formaAplicacion: string = '';

   constructor(
    private fb: FormBuilder, 
    private juiciosMercantilesService: JuiciosMercantilesService, 
    private snackBar: MatSnackBar, 
    private zone: NgZone, 
    private dialogRef: MatDialogRef<BeneficiarioJmDialog>,
   @Inject(MAT_DIALOG_DATA) public data: { empleadoId: number; bancos: Banco[] }) {}

  ngOnInit() {
        this.form = this.fb.group({
          busqueda: this.fb.group({
            searchText: [''],
            empleadoId: [null],
            rfc: [''],
            primerApellido: [''],
            segundoApellido: [''],
            nombre: ['']
          }),
          empleado: this.fb.group({
            rfc: ['', []],
            primerApellido: [''],
            segundoApellido: [''],
            nombre: [''],
          }),
          beneficiario: this.fb.group({
            rfc: ['', [rfcValidator]],
            primerApellido: [''],
            segundoApellido: [''],
            nombre: [''],
          }),
          descuento: this.fb.group({
            formaAplicacion: [''],
            factorImporte: [null],
            bancoId: [null],
            clabe: ['', []],
            importeTotal: [null],
            citaBancaria: ['']
          }),
          vigencia: this.fb.group({
            inicio: ['', [vigenciaFormatoValidator()]],
            fin: ['', [vigenciaFormatoValidator()]]
          }),
          anio: [null],
          quincena: [null],
        },
  
        { validators: [factorImporteValidator(), vigenciaRangoValidator()]}
      );
  
        // Usa datos del padre
        this.bancos = this.data?.bancos ?? [];
        // Setea el empleadoId recibido por el padre en el form del diálogo
        this.form.get('busqueda.empleadoId')?.setValue(Number(this.data?.empleadoId));
  }

  // Agregar este método helper a la clase
  private showSnack(message: string, action: string, duration: number): void {
    this.zone.runOutsideAngular(() => {
      setTimeout(() => {
        this.zone.run(() => this.snackBar.open(message, action, { duration }));
      }, 50);
    });
  }

  guardar(): void {
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    this.showSnack('Formulario inválido', 'Cerrar', 4000);
    return;
  }

  const raw = this.form.get('busqueda.empleadoId')?.value;
  const empleadoId = raw !== null && raw !== undefined ? Number(raw) : NaN;

  if (!Number.isFinite(empleadoId)) {
    this.showSnack('Seleccionar primero un empleado', 'Cerrar', 4000);
    return;
  }

  const fv = this.form.value;
  const payload = {
    tabEmpleadosId: Number(this.data.empleadoId),
    formaAplicacion: fv.descuento?.formaAplicacion,
    factorImporte: fv.descuento?.factorImporte,
    numeroDocumento: fv.descuento?.citaBancaria,
    qnaini: Number(fv.vigencia?.inicio),
    qnafin: Number(fv.vigencia?.fin),
    tabBeneficiariosJmId: Number(this.data.empleadoId),
    numeroBenef: 1
  };

  this.juiciosMercantilesService.agregarBeneficiario(payload).subscribe({
    next: () => {
      this.showSnack('Beneficiario guardado correctamente', 'Cerrar', 4000);
      this.cerrar(); // o clearFilters(), pero normalmente se cierra el diálogo
    },
    error: () => this.showSnack('Error al guardar beneficiario', 'Cerrar', 4000),
  });
  }

  clearFilters(): void {
    this.form.reset();
    this.resultado = [];
    this.autocompleteTrigger?.closePanel();
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}

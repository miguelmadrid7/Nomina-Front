import { CommonModule } from '@angular/common';
import { Component, NgZone, ViewChild } from '@angular/core';
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
import { MatDialogRef } from '@angular/material/dialog';

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
    private dialogRef: MatDialogRef<BeneficiarioJmDialog>) {}

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
            inicio: [''],
            fin: ['']
          }),
          anio: [null],
          quincena: [null],
        },
    
        { validators: [factorImporteValidator(), vigenciaRangoValidator()]}
      );
    
        this.juiciosMercantilesService.getBancos().subscribe({
          next: (resp) => {
            this.bancos = resp?.data ?? [];
          },
          error: () => {
            this.bancos = [];
            this.showSnack('Error al cargar catálogo de bancos', 'Cerrar', 4000);
          }
        });
  }
    


   // Agregar este método helper a la clase
  private showSnack(message: string, action: string, duration: number): void {
    this.zone.runOutsideAngular(() => {
      setTimeout(() => {
        this.zone.run(() => this.snackBar.open(message, action, { duration }));
      }, 50);
    });
  }

  onVigenciaInput(tipo: 'inicio' | 'fin') {

    if (tipo === 'inicio') {
      if (!this.vigenciaInicio) return;

      let valor = this.vigenciaInicio.toString();

      // Solo números
      valor = valor.replace(/\D/g, '');

      // Máximo 6 dígitos
      if (valor.length > 6) {
        valor = valor.substring(0, 6);
      }

      this.vigenciaInicio = valor;
    }

    if (tipo === 'fin') {
      if (!this.vigenciaFin) return;

      let valor = this.vigenciaFin.toString();

      // Solo números
      valor = valor.replace(/\D/g, '');

      // Máximo 6 dígitos
      if (valor.length > 6) {
        valor = valor.substring(0, 6);
      }

      this.vigenciaFin = valor;
    }
  }

  onFactorImporteInput() {

    if (this.factorImporte == null) return;

    // FACTOR (porcentaje)
    if (this.formaAplicacion === 'P') {

      let valor = this.factorImporte.toString();

      // Solo números
      valor = valor.replace(/\D/g, '');

      // Máximo 3 dígitos
      if (valor.length > 3) {
        valor = valor.substring(0, 3);
      }

      let numero = Number(valor);

      // Máximo 100%
      if (numero > 100) {
        numero = 100;
      }

      this.factorImporte = numero;
    }

    // IMPORTE FIJO
    if (this.formaAplicacion === 'C') {
      // Solo validar que sea número positivo
      let numero = Number(this.factorImporte);

      if (isNaN(numero)) {
        this.factorImporte = undefined as any;
        return;
      }

      if (numero < 0) {
        this.factorImporte = 0;
      }
    }
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.showSnack('Formulario inválido', 'Cerrar', 4000);
      return; 
    }

    const formValue = this.form.value;

    const empleadoId = this.form.get('busqueda.empleadoId')?.value;
    if (!empleadoId) {
      this.showSnack('Seleccionar primero un empleado', 'Cerrar', 4000);
      return;
    }

    const payload = {
      empleadoId,
      rfc: formValue.beneficiario?.rfc,
      primerApellido: formValue.beneficiario?.primerApellido,
      segundoApellido: formValue.beneficiario?.segundoApellido,
      nombre: formValue.beneficiario?.nombre
    };

    this.juiciosMercantilesService.agregarBeneficiario(payload).subscribe({
      next: () => {
        this.showSnack('Beneficiario guardado correctamente', 'Cerrar', 4000);
        this.clearFilters();
      },
       error: () => {
        this.showSnack('Error al guardar beneficiario' , 'Cerrar', 4000);
      }
    })

  }

  clearFilters(): void {
    this.form.reset();
    this.resultado = [];
    this.autocompleteTrigger?.closePanel();
  }

  close(): void {
    this.dialogRef.close();
  }

}

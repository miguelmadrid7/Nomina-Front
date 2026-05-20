import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatOption, MatSelectModule } from '@angular/material/select';
import { PensionAlimenticiaService } from '../../../core/services/pension-alimenticia.service';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { ViewChild } from '@angular/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { Empleado } from '../../servicios/empleado';
import { EmpleadoItem } from '../../../models/emplado.model';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PensionAlimenDialog } from '../pension-alimen-dialog/pension-alimen-dialog';
import { IdResponse } from '../../../models/id-Response.model';
import { Banco } from '../../../models/banco.model';
import { BeneficiarioRequest } from '../../../models/beneficiario.model';
import { ApiResponse } from '../../../models/api-Response.model';
import { esCURP, esRFC, rfcValidator, vigenciaFormatoValidator } from '../../../shared/validators/validaciones.validators';
import { factorImporteValidator } from '../../../shared/validators/juicios.validators';
import { UppercaseDirective } from "../../../shared/directives/upperCase.directivas";
import { SoloLetrasDirectiva } from "../../../shared/directives/solo-letras.directivas";

@Component({
  selector: 'app-pension-alimenticia',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatButtonModule,
    MatSelectModule,
    MatOption,
    MatAutocompleteModule,
    MatOptionModule,
    MatIconModule,
    MatDialogModule,
    UppercaseDirective,
    SoloLetrasDirectiva
],
  templateUrl: './pension-alimenticia.html',
  styleUrl: './pension-alimenticia.css'
})
export class PensionAlimenticia {
  @ViewChild(MatAutocompleteTrigger) autocompleteTrigger?: MatAutocompleteTrigger;
  form!: FormGroup;
  searchText: string = '';
  rfc: string = '';
  apellidoPaterno: string = '';
  apellidoMaterno: string = '';
  nombreCompleto: string = '';
  formaAplicacion: string = '';
  factorImporte: number | null = null;
  numeroDocumento: string = '';
  vigenciaInicio: string = '';
  vigenciaFin: string = '';
  numeroBeneficiario: number | null = null;
  empleadoId: number | null = null;
  bancos: Banco[] = [];
  bancoSeleccionado: number | null = null;
  resultados: EmpleadoItem[] = [];
  cargandoBusqueda = false;
  guardando = false;


  constructor(private fb: FormBuilder, private pensionAlimenticiaService: PensionAlimenticiaService, private dialog: MatDialog) {}

  ngOnInit (): void {
    this.loadBanksCatalog();
    this.initForm();
  }

  initForm (){
    this.form = this.fb.group({
      numeroBeneficiario: [null],
      searchText: [''],
      apellidoPaterno: ['', [Validators.required, Validators.minLength(2)]],
      apellidoMaterno: ['', [Validators.required, Validators.minLength(2)]],
      nombreCompleto: ['', [Validators.required, Validators.minLength(2)]],
      rfc: ['', [Validators.required, rfcValidator()]],
      formaAplicacion: ['', Validators.required],
      factorImporte: [null, [Validators.required, factorImporteValidator()]],
      bancoSeleccionado: [null, Validators.required],
      numeroDocumento: [null, [Validators.required, Validators.pattern(/^\d{18}$/)]],
      vigenciaInicio: ['', [Validators.required, vigenciaFormatoValidator()]],
      vigenciaFin: ['', [Validators.required, vigenciaFormatoValidator()]],
    },
    { validators: [ factorImporteValidator() ] }
    );
  }

  get f(){
    return this.form.controls;
  }


  displayEmployee (emp: EmpleadoItem | string | null): string {
    if (!emp) return '';
    if (typeof emp === 'string') return emp;
    const rfc  = (emp.rfc ?? emp.RFC ?? '').toString().trim() || '—';
    const curp = (emp.curp ?? emp.CURP ?? '').toString().trim() || '—';
    const nombre = (emp.nombreCompleto ?? '').toString().trim() || '—';
    return `${rfc} · ${curp} · ${nombre}`;
  }

  onOptionSelected (emp: EmpleadoItem) {
    this.selectEmployee(emp);
    this.form.get('searchText')?.setValue(this.displayEmployee(emp));
  }

  searchEmployee () {
    const q = (this.form.get('searchText')?.value || '').trim().toUpperCase();
    if (!q) {
      this.resultados = [];
      return;
    }
    this.cargandoBusqueda = true;

    // deja pasar si es RFC/CURP parcial con >=3
    const targetRFC  = esRFC(q)  ? 'RFC'  : null;
    const targetCURP = esCURP(q) ? 'CURP' : null;

    if (q.length < 3 && !esRFC(q) && !esCURP(q)) {
      this.resultados = [];
      this.cargandoBusqueda = false;
      return;
    }

    const obs =
      (esRFC(q) || (targetRFC && q.length >= 3))  ? this.pensionAlimenticiaService.searchPorTarget('RFC', q)  :
      (esCURP(q) || (targetCURP && q.length >= 3))? this.pensionAlimenticiaService.searchPorTarget('CURP', q) :
                                                    this.pensionAlimenticiaService.searchEmpleadoLibre(q);


    obs.subscribe({
      next: (resp: ApiResponse<Empleado | Empleado[]>) => {
        const d = resp?.data;
        const arr = Array.isArray(d) ? d : (d ? [d] : []);

        this.resultados = arr.map((emp: EmpleadoItem) => {
            let rfc = (emp?.rfc ?? emp?.RFC ?? '').toString().trim();
            let curp = (emp?.curp ?? emp?.CURP ?? '').toString().trim();
            const concatenado = (emp?.empleado ?? '').toString().trim();

            // Si el backend mandó todo en "empleado"
            if ((!rfc || !curp) && concatenado.includes('-')) {
              const partes = concatenado.split('-').map(p => p.trim());
              if (partes.length >= 3) {
                rfc = rfc || partes[0];
                curp = curp || partes[1];
              }
            }

            const pa = (emp?.primer_apellido ?? emp?.primerApellido ?? '').toString().trim();
            const sa = (emp?.segundo_apellido ?? emp?.segundoApellido ?? '').toString().trim();
            const no = (emp?.nombre ?? '').toString().trim();
            const nombre = (
                [pa, sa, no].filter(Boolean).join(' ') ||
                (concatenado.includes('-') ? concatenado.split('-').slice(2).join('-').trim() : concatenado)
              )
              .replace(/\s+/g, ' ')
              .trim();

            return {
              ...emp,
              rfc,
              curp,
              nombreCompleto: nombre
            } as EmpleadoItem;
          });

        this.cargandoBusqueda = false;
        setTimeout(() => {
          if (!this.autocompleteTrigger) return;
            if (this.resultados.length > 0) {
              this.autocompleteTrigger.openPanel();
            } else {
              this.autocompleteTrigger.closePanel();
            }
          });
        },
        error: () => {
          this.resultados = [];
          this.cargandoBusqueda = false;
          this.autocompleteTrigger?.closePanel();
        }
      });
  }

  selectEmployee (emp: EmpleadoItem) {
  if (emp?.id == null) {
    console.warn('Empleado sin id');
    this.empleadoId = null;
    return;
  }
  this.empleadoId = emp.id;

  }

  onSearchInputChange () {
    const searchValue = this.form.get('searchText')?.value || '';
    if (!searchValue || searchValue.trim().length === 0) {
      this.resultados = [];
      this.autocompleteTrigger?.closePanel();
      this.empleadoId = null;
    }
  }

  loadBanksCatalog (): void {
    this.pensionAlimenticiaService.getBancos()
    .subscribe({
      next: (response: ApiResponse<Banco[]>) => {
        this.bancos = response.data;
      },
      error: (err: any) => {
        console.error('Error al  cargar bancos', err)
      }
    })
  }

  saveEmployee () {
    if (this.guardando) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando = true;
    const value = this.form.value;
    const beneficiarioAlimPayload = {
      rfc: value.rfc,
      primerApellido: value.apellidoPaterno,
      segundoApellido: value.apellidoMaterno,
      nombre: value.nombreCompleto
    };

      this.guardando = true;
      const fail = (msg: string) => {
        this.dialog.open(PensionAlimenDialog, {
          width: '360px',
          data: { title: 'Faltan datos', message: msg, type: 'error' }
        });
        this.guardando = false;
      };

      if (!this.empleadoId) return fail('Selecciona un empleado antes de guardar.');
      if (!['P','C'].includes(value.formaAplicacion)) return fail('Selecciona la forma de aplicación.');
      if (value.factorImporte == null) return fail('Captura Factor/Importe.');
      if (!value.vigenciaInicio || !value.vigenciaFin) return fail('Captura la vigencia de inicio y fin.');

      // Normalizar y validar CLABE (18 dígitos)
      const clabe = String(value.numeroDocumento ?? '').trim().replace(/\D+/g, '');
      if (!/^\d{18}$/.test(clabe)) return fail('La CLABE debe tener exactamente 18 dígitos numéricos.');

      this.pensionAlimenticiaService.addBeneficiarioAlim(beneficiarioAlimPayload).subscribe({
        next: (resp: ApiResponse<IdResponse>) =>{
          const beneficiarioAlimId = resp?.data?.id;
          if (!beneficiarioAlimId) {
            this.dialog.open(PensionAlimenDialog, {
              width: '360px',
              data: { title: 'Error', message: 'No se recibió ID del beneficiario base.', type: 'error' }
            });
            this.guardando = false;
            return;
          }

          let factor = Number(value.factorImporte);
          if (Number.isNaN(factor)) {
            return fail('El campo Factor/Importe debe ser numérico.');
          }
          
          if (value.formaAplicacion === 'P') {
            if (factor > 1) factor = factor / 100;
            if (!(factor > 0 && factor <= 1)) {
              return fail('Para Factor, usa un porcentaje válido (ej. 20 = 20%). Debe ser mayor a 0 y hasta 100%.');
            }
          } else {
            if (factor < 0) {
              return fail('El Importe fijo debe ser mayor o igual a 0.');
            }
          }

          const beneficiarioPayload: BeneficiarioRequest = {
            tabEmpleadosId: this.empleadoId!,
            tabBeneficiariosAlimId: beneficiarioAlimId,
            catBancoId: value.bancoSeleccionado,
            formaAplicacion: value.formaAplicacion as 'P' | 'C',
            factorImporte: factor,
            qnaini: Number(value.vigenciaInicio),
            qnafin: Number(value.vigenciaFin),
            numeroDocumento: clabe
          };

          if (value.numeroBeneficiario != null && !Number.isNaN(Number(value.numeroBeneficiario))) {
            beneficiarioPayload.numeroBenef = Number(value.numeroBeneficiario);
          }

          if ([beneficiarioPayload.factorImporte, beneficiarioPayload.qnaini, beneficiarioPayload.qnafin].some((v: number) => Number.isNaN(v))) {
            return fail('Revisa que los campos numéricos tengan valores válidos.');
          }

          this.pensionAlimenticiaService.addBeneficario(beneficiarioPayload).subscribe({
            next: () => {
              this.dialog.open(PensionAlimenDialog, {
                width: '360px',
                data: { title: 'Éxito', message: 'Se guardó correctamente tus datos.', type: 'success' }
              });
              this.guardando = false;
              this.resetForm();
            },
            error: err => {
              console.error('Error al guardar pensión alimenticia', err);
              this.dialog.open(PensionAlimenDialog, {
                width: '360px',
                data: { title: 'Error', message: 'Error al guardar pensión alimenticia.', type: 'error' }
              });
              this.guardando = false;
            }
          });
        },
        error: err => {
          console.error('Error al crear beneficiario base', err);
          this.dialog.open(PensionAlimenDialog, {
            width: '360px',
            data: { title: 'Error', message: 'No se pudo crear el beneficiario base.', type: 'error' }
          });
          this.guardando = false;
        }
      });
  }

  // Limpia los campos del formulario de captura (no toca la búsqueda/empleado)
  private resetForm () {
   this.form.reset({
    numeroBeneficiario: null,
    searchText: this.form.get('searchText')?.value, // Mantener el texto de búsqueda
    apellidoPaterno: '',
    apellidoMaterno: '',
    nombreCompleto: '',
    rfc: '',
    formaAplicacion: '',
    factorImporte: null,
    bancoSeleccionado: null,
    numeroDocumento: null,
    vigenciaInicio: '',
    vigenciaFin: ''
  });
  }

  clearSearch () {
   // Limpiar todo el formulario
  this.form.reset({
    numeroBeneficiario: null,
    searchText: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    nombreCompleto: '',
    rfc: '',
    formaAplicacion: '',
    factorImporte: null,
    bancoSeleccionado: null,
    numeroDocumento: null,
    vigenciaInicio: '',
    vigenciaFin: ''
  });
  
  // Limpiar variables de búsqueda
  this.resultados = [];
  this.cargandoBusqueda = false;
  this.empleadoId = null;
  this.autocompleteTrigger?.closePanel();
  }

  formatearImporte () {
    const factorImporte = this.form.get('factorImporte')?.value;
    const formaAplicacion = this.form.get('formaAplicacion')?.value;
    if (factorImporte == null) return;
    let valor = Number(factorImporte);
    if (isNaN(valor)) return;
    if (formaAplicacion === 'C') {
      if (valor < 0) valor = 0;
      this.form.get('factorImporte')?.setValue(Number(valor.toFixed(2)));
    }
  }

  // limpiar el valor al cambiar el tipo
  onFormaChange() {
    this.form.get('factorImporte')?.setValue(null);
  }

  onFactorImporteInput() {
  const formaAplicacion = this.form.get('formaAplicacion')?.value;
    const factorImporte = this.form.get('factorImporte')?.value;
    if (factorImporte == null) return;
    if (formaAplicacion === 'P') {
      let valor = factorImporte.toString();
      valor = valor.replace(/\D/g, '');
      if (valor.length > 3) {
        valor = valor.substring(0, 3);
      }
      let numero = Number(valor);
      if (numero > 100) {
        numero = 100;
      }
      this.form.get('factorImporte')?.setValue(numero);
    } else {
      let numero = Number(factorImporte);
      if (isNaN(numero)) {
        this.form.get('factorImporte')?.setValue(undefined as any);
        return;
      }
      if (numero < 0) {
        numero = 0;
      }
      this.form.get('factorImporte')?.setValue(numero);
    }
  }

  onVigenciaInput(tipo: 'inicio' | 'fin') {
    if (tipo === 'inicio') {
      const vigenciaInicio = this.form.get('vigenciaInicio')?.value;
      if (!vigenciaInicio) return;

      let valor = vigenciaInicio.toString();
      valor = valor.replace(/\D/g, '');
      if (valor.length > 6) {
        valor = valor.substring(0, 6);
      }
      this.form.get('vigenciaInicio')?.setValue(valor);
    }

    if (tipo === 'fin') {
      const vigenciaFin = this.form.get('vigenciaFin')?.value;
      if (!vigenciaFin) return;

      let valor = vigenciaFin.toString();
      valor = valor.replace(/\D/g, '');
      if (valor.length > 6) {
        valor = valor.substring(0, 6);
      }
      this.form.get('vigenciaFin')?.setValue(valor);
    }
  }

}

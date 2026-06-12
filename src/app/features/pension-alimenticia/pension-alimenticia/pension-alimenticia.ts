import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { IdResponse } from '../../../models/response/id-response.model';
import { Banco } from '../../../models/banco.model';
import { ApiResponse } from '../../../models/response/api-Response.model';
import { getCurrentQna, vigenciaFormatoValidator } from '../../../shared/validators/validaciones.validators';
import { factorImporteValidator } from '../../../shared/validators/juicios.validators';
import { UppercaseDirective } from "../../../shared/directives/upperCase.directivas";
import { SoloLetrasDirectiva } from "../../../shared/directives/solo-letras.directivas";
import { esCURP, esRFC, withChartPercent } from '../../../shared/helpers/helpers.helpers';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { NgApexchartsModule } from 'ng-apexcharts';
import { LiquidoResponse } from '../../../models/response/liquido-response.model';
import { BeneficiarioRequest } from '../../../models/request/beneficiario-request.model';
import { formatEmployeeDisplay, mapEmpleado } from '../../../shared/helpers/empelado.helper';

@Component({
  selector: 'app-pension-alimenticia',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
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
    MatCheckboxModule,
    MatSlideToggleModule,
    NgApexchartsModule,
    UppercaseDirective,
    SoloLetrasDirectiva
],
  templateUrl: './pension-alimenticia.html',
  styleUrl: './pension-alimenticia.css'
})
export class PensionAlimenticia {
  @ViewChild(MatAutocompleteTrigger) autocompleteTrigger?: MatAutocompleteTrigger;
  form!: FormGroup;
  empleadoId: number | null = null;
  bancos: Banco[] = [];
  resultados: EmpleadoItem[] = [];
  cargandoBusqueda = false;
  guardando = false;
  liquidoInfo: LiquidoResponse | null = null;
  liquidoError: string | null = null;
  cargandoLiquido = false;
  readonly  porcentajeTotal = 100;
  porcentajeDisponible = 100;
  beneficiariosCapturados: number[] = [];  

  private readonly  fb = inject(FormBuilder); 
  private readonly  pensionAlimenticiaService = inject(PensionAlimenticiaService); 
  private readonly  dialog = inject(MatDialog); 
  private readonly  cdr = inject(ChangeDetectorRef); 

  ngOnInit (): void {
    this.loadBanksCatalog();
    this.initForm();
  }

  initForm (){
    const { aaaaqq } = getCurrentQna();
      this.form = this.fb.group({
        numeroBeneficiario: [null],
        searchText: [''],
        apellidoPaterno: ['', [Validators.required, Validators.minLength(2)]],
        apellidoMaterno: ['', [Validators.required, Validators.minLength(2)]],
        nombreCompleto: ['', [Validators.required, Validators.minLength(2)]],
        rfc: ['', [Validators.required,Validators.pattern(/^.{13}$/)]],
        formaAplicacion: ['', Validators.required],

        aplicarDescuento: [false], 
        montoTotal: [{ value: null, disabled: true }],
        aplicarDescuentoAguinaldo: [false],
        tipoPorcentaje: [null],
        tipoBase: [null],

        numeroOficio: ['',[Validators.required,Validators.pattern(/^[A-Z0-9\/\-]+$/)]],
        factorImporte: [null, [Validators.required, factorImporteValidator()]],
        bancoSeleccionado: [null],
        numeroDocumento: [null, [Validators.pattern(/^\d{18}$/)]],
        vigenciaInicio: [aaaaqq.toString(), [Validators.required, vigenciaFormatoValidator()]],
      },
      { validators: [ factorImporteValidator() ] }
      );
  }

  get f(){
    return this.form.controls;
  }

  get disponiblePension(): boolean {
    return this.porcentajeDisponible > 0;
  }

  private getHorasFromPlaza(clavePlaza: string): number {
    if (!clavePlaza) return 0;
    const parteAntesPunto = clavePlaza.split('.')[0] || '';
    const ultimos2 = parteAntesPunto.slice(-2);
    return parseInt(ultimos2, 10) || 0;
  }

  readonly displayFn = (emp: EmpleadoItem | string | null): string => formatEmployeeDisplay(emp);

  chartOptions: any = {
    series: [100],
    chart: { type: 'radialBar', height: 200,sparkline: { enabled: true }, },
    plotOptions: {
      radialBar: { startAngle: -90, endAngle: 90, hollow: { size: '60%' }, track: { margin: 0 },
        dataLabels: {
          name: { show: false },
          value: { fontSize: '28px',  offsetY: 1, formatter: (val: number) => `${Math.round(val)}%` }
        }
      }
    },
    colors: ['#2563eb'], 
    labels: ['Disponible']
  };

  updateChart(percent: number) {
    this.porcentajeDisponible = percent;
    this.renderChartFromDisponible();
  }

  onOptionSelected (emp: EmpleadoItem) {
    this.empleadoId = emp.id ?? null;
    this.selectEmployee(emp);
    this.form.get('searchText')?.setValue(formatEmployeeDisplay(emp));
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
        this.resultados = arr.map(mapEmpleado);
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

  selectEmployee(emp: EmpleadoItem): void {
    if (!emp?.id) {
        this.empleadoId = null;
        return;
    }
    this.empleadoId = emp.id;
    const rfc = (emp.rfc ?? emp.RFC ?? '').toString().trim();
    if (rfc) {
        this.pensionAlimenticiaService.getPorcentajeAcumuladoByRfc(rfc).subscribe({
            next: (porcentajeAcumulado: number) => {
                this.porcentajeDisponible = Math.max(0, 100 - porcentajeAcumulado);
                this.renderChartFromDisponible();
            },
            error: () => {
              if (emp.id) {
                this.cargarPorcentajeDisponible(emp.id);
              }
            }
        });
        this.cargarLiquidoByRfc(rfc);
    } else {
        this.cargarPorcentajeDisponible(emp.id);
    }
  }

  private cargarLiquidoByRfc(rfc: string): void {
    this.cargandoLiquido = true;
    this.liquidoInfo = null;
    this.liquidoError = null;

    this.pensionAlimenticiaService.getLiquidoByRfc(rfc).subscribe({
      next: (resp) => {
        if (resp.success && resp.data?.plazas?.length) {
          resp.data.plazas.sort((a, b) => this.getHorasFromPlaza(b.clavePlaza) - this.getHorasFromPlaza(a.clavePlaza));
            this.liquidoInfo  = resp.data;
            this.liquidoError = null;
        } else {
          this.liquidoInfo  = null;
          this.liquidoError = resp.message ?? 'No se encontró información de nómina.';
        }
          this.cargandoLiquido = false;
            this.cdr.detectChanges();
      },
        error: () => {
          this.liquidoInfo = null;
          this.liquidoError = 'No se pudo obtener la información de nómina.';
          this.cargandoLiquido = false;
          this.cdr.detectChanges();
          }
    });
  }

  private renderChartFromDisponible(): void {
    this.chartOptions = withChartPercent(this.chartOptions, this.porcentajeDisponible);
  }

  private cargarPorcentajeDisponible(empleadoId: number) {
    this.pensionAlimenticiaService.getBeneficiaryByEmployee(empleadoId)
      .subscribe({
        next: (resp) => {
          const porcentajeUsado = resp.data
            .filter(x => x.formaAplicacion === 'P')
            .reduce((sum, item) => sum + (Number(item.factorImporte) * 100), 0);

          this.porcentajeDisponible = Math.max(0, this.porcentajeTotal - porcentajeUsado);
          this.renderChartFromDisponible(); // clave
        },
        error: () => {
          this.porcentajeDisponible = 100;
          this.renderChartFromDisponible(); // clave
        }
      });
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

   
      const fail = (msg: string) => {
        this.dialog.open(PensionAlimenDialog, {
          width: '360px',
          data: { title: 'Faltan datos', message: msg, type: 'error' }
        });
        this.guardando = false;
      };

      if (!this.empleadoId) return fail('Selecciona un empleado antes de guardar.');
      if (!['P','F'].includes(value.formaAplicacion)) return fail('Selecciona la forma de aplicación.');
      if (value.factorImporte == null) return fail('Captura Factor/Importe.');
      if (!value.vigenciaInicio) return fail('Captura la vigencia de inicio.');

      // Normalizar y validar CLABE (18 dígitos)
      const clabe = String(value.numeroDocumento ?? '').trim().replace(/\D+/g, '');
        if (clabe && !/^\d{18}$/.test(clabe)) {
          return fail('La CLABE debe tener exactamente 18 dígitos numéricos.');
        }
        

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
            catBancoId: value.bancoSeleccionado || null,
            formaAplicacion: value.formaAplicacion as 'P' | 'F',
           
            tipoPorcentaje: value.formaAplicacion === 'P' ? value.tipoPorcentaje : undefined,
            tipoBase: value.tipoPorcentaje === 1 ? value.tipoBase : undefined,
            factorImporte: factor,
            qnaini: Number(value.vigenciaInicio),
            qnafin: 999999,
            // ✅ Agrega esta línea en el payload
            importeTotal: value.montoTotal ? Number(value.montoTotal) : null,
            aplicarDescuentoAguinaldo: value.aplicarDescuentoAguinaldo ?? false,
            numeroDocumento: clabe || null,
            numeroOficio: value.numeroOficio || null
          };

          if (value.numeroBeneficiario != null && !Number.isNaN(Number(value.numeroBeneficiario))) {
            beneficiarioPayload.numeroBenef = Number(value.numeroBeneficiario);
          }

          if ([beneficiarioPayload.factorImporte, beneficiarioPayload.qnaini].some((v: number) => Number.isNaN(v))) {
            return fail('Revisa que los campos numéricos tengan valores válidos.');
          }

          this.pensionAlimenticiaService.addBeneficario(beneficiarioPayload).subscribe({
            next: () => {
              this.dialog.open(PensionAlimenDialog, {
                width: '360px',
                data: {
                  title: 'Éxito',
                  message: 'Se guardó correctamente tus datos.',
                  type: 'success'
                }
              });
              this.guardando = false;
              if (this.empleadoId) {
                this.cargarPorcentajeDisponible(this.empleadoId);
              }
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

  private resetForm () {
    const { aaaaqq } = getCurrentQna();
      this.form.reset({
        numeroBeneficiario: null,
        searchText: this.form.get('searchText')?.value, 
        apellidoPaterno: '',
        apellidoMaterno: '',
        nombreCompleto: '',
        rfc: '',
        formaAplicacion: '',
        factorImporte: null,
        bancoSeleccionado: null,
        numeroDocumento: null,
        vigenciaInicio: aaaaqq.toString(),
      });

    Object.keys(this.form.controls).forEach(key => {
      this.form.get(key)?.setErrors(null);
      this.form.get(key)?.markAsPristine();
      this.form.get(key)?.markAsUntouched();
    });

    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  clearSearch () {
    const { aaaaqq } = getCurrentQna();
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
        vigenciaInicio: aaaaqq.toString(),
    });

    this.beneficiariosCapturados = [];
    this.porcentajeDisponible = 100;
    this.renderChartFromDisponible();
    this.liquidoInfo = null;
    this.liquidoError = null;
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
    if (formaAplicacion === 'F') {
      if (valor < 0) valor = 0;
      this.form.get('factorImporte')?.setValue(Number(valor.toFixed(2)));
    }
  }

  onFormaChange() {
    this.form.get('factorImporte')?.setValue(null);
    this.form.get('tipoPorcentaje')?.setValue(null); 
    this.form.get('tipoBase')?.setValue(null);  

    const formaAplicacion = this.form.get('formaAplicacion')?.value;
    const monto = this.form.get('montoTotal');
    if (!monto) return;

    if (formaAplicacion === 'F') {
        monto.enable();
        monto.setValidators([Validators.required, Validators.min(1)]);
    } else {
        monto.clearValidators();
        monto.reset();
        monto.disable();
    }
    monto.updateValueAndValidity();
    this.cdr.detectChanges();
  }

  onFactorImporteInput() {
  const formaAplicacion = this.form.get('formaAplicacion')?.value;
  const factorImporte = this.form.get('factorImporte')?.value;
    if (factorImporte == null) return;
    if (formaAplicacion === 'P') {
      let valor = factorImporte.toString();
        valor =  valor.replace(/\D/g, '');
      if (valor.length > 3) {
        valor = valor.substring(0, 3);
      }
      let numero = Number(valor);
      const disponibleReal = this.porcentajeDisponible;
        if (numero > disponibleReal) {
          numero = disponibleReal;
        }
      this.form.get('factorImporte')?.setValue(numero, {
        emitEvent: false
      });
    } else {
      let numero = Number(factorImporte);
      if (isNaN(numero)) {
        return;
      }
      if (numero < 0) {
        numero = 0;
      }
      this.form.get('factorImporte')?.setValue(numero, {
        emitEvent: false
      });
    }
  }

  onVigenciaInput(tipo: 'inicio') {
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
  }

  recalcularDisponible() {
    const acumulado =
      this.beneficiariosCapturados.reduce(
        (a, b) => a + b,
        0
      );

    this.porcentajeDisponible =
      Math.max(
        0,
        this.porcentajeTotal - acumulado
      );
  }

  onAplicarDescuentoChange() {
    const checked = this.form.get('aplicarDescuento')?.value;
    const monto = this.form.get('montoTotal');
    if (!monto) return;
    if (checked) {
      monto.enable();
      monto.setValidators([
        Validators.required,
        Validators.min(1)
      ]);

    } else {
      monto.clearValidators();
      monto.reset();
      monto.disable();
    }
    monto.updateValueAndValidity();
    this.cdr.detectChanges();
  }
}

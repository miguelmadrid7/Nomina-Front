import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy } from '@angular/core';
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
import { EmpleadoItem } from '../../../core/model/emplado.model';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PensionAlimenDialog } from '../pension-alimen-dialog/pension-alimen-dialog';
import { IdResponse } from '../../../core/model/response/id-response.model';
import { Banco } from '../../../core/model/banco.model';
import { ApiResponse } from '../../../core/model/response/api-Response.model';
import { vigenciaFormatoValidator } from '../../../shared/validators/validaciones.validators';
import { factorImporteValidator } from '../../../shared/validators/juicios.validators';
import { UppercaseDirective } from "../../../shared/directives/upperCase.directivas";
import { SoloLetrasDirectiva } from "../../../shared/directives/solo-letras.directivas";
import { esCURP, esRFC, withChartPercent, shouldBoldLegendItem  } from '../../../shared/helpers/helpers.helpers';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { NgApexchartsModule } from 'ng-apexcharts';
import { LiquidoResponse } from '../../../core/model/response/liquido-response.model';
import { BeneficiarioRequest } from '../../../core/model/request/beneficiario-request.model';
import { formatEmployeeDisplay, mapEmpleado } from '../../../shared/helpers/empelado.helper';
import { CalendarioService } from '../../../core/services/calendario.service';
import { Calendario } from '../../../core/model/calendario.model';
import { ToastService } from '../../../core/services/toast.service';

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
export class PensionAlimenticia implements OnDestroy {

  private readonly fb = inject(FormBuilder); 
  private readonly pensionAlimenticiaService = inject(PensionAlimenticiaService); 
  private readonly dialog = inject(MatDialog); 
  private readonly cdr = inject(ChangeDetectorRef); 
  private readonly calendarioService = inject(CalendarioService);
  private readonly toastService = inject(ToastService);

  
  @ViewChild(MatAutocompleteTrigger) autocompleteTrigger?: MatAutocompleteTrigger;
  @ViewChild('chart') chartComponent: any;
   
  form!: FormGroup;
  empleadoId: number | null = null;
  bancos: Banco[] = [];
  resultados: EmpleadoItem[] = [];
  cargandoBusqueda = false;
  guardando = false;
  liquidoInfo: LiquidoResponse | null = null;
  liquidoError: string | null = null;
  cargandoLiquido = false;
  porcentajeDisponible = 100;
  beneficiariosCapturados: number[] = []; 
  calendarioActual: Calendario | null = null;
  cargandoQna = false; 
  errorQna = false;
  baseCalculo: number | null = null;
  cargandoBase = false;
  empleadoRfc: string | null = null;

  readonly  porcentajeTotal = 100;
  readonly shouldBoldLegendItem = shouldBoldLegendItem;


  ngOnInit (): void {
    this.loadBanksCatalog();
    this.initForm();
    this.loadQnaActiva();
  }

  ngOnDestroy () {
    this.dialog.closeAll();
  }

  initForm (){
      this.form = this.fb.group({
        numeroBeneficiario: [null],
        searchText: [''],
        apellidoPaterno: ['', [Validators.required, Validators.minLength(2)]],
        apellidoMaterno: ['', [Validators.required, Validators.minLength(2)]],
        nombreCompleto: ['', [Validators.required, Validators.minLength(2)]],
        rfc: ['', [Validators.required,Validators.pattern(/^.{13}$/)]],
        formaAplicacion: ['', Validators.required],
        importeTotal: [null],
        aplicarDescuento: [false], 
        aplicarDescuentoAguinaldo: [false],
        tipoPorcentaje: [null],
        tipoBase: [null],
        numeroOficio: ['',[Validators.required,Validators.pattern(/^[A-Z0-9\/\-]+$/)]],
        factorImporte: [null, [Validators.required, factorImporteValidator()]],
        bancoSeleccionado: [null],
        numeroDocumento: [null, [Validators.pattern(/^\d{18}$/)]],
        vigenciaInicio: [
          this.calendarioActual ? this.toAaaaqq(this.calendarioActual) : '', [Validators.required, vigenciaFormatoValidator()]
        ],
      });
  }

  loadQnaActiva(): void  {
    this.cargandoQna = true;
    this.errorQna = false;

    this.calendarioService.getQnaActiva().subscribe({
      next: (resp) => {
        const calendario = resp?.data ?? null;
          this.calendarioActual = calendario;
          this.cargandoQna = false;
          this.errorQna = !calendario;
          this.initForm();
          this.cdr.detectChanges();      
      }, 
        error: (err) => {
          this.calendarioActual = null;
          this.cargandoQna = false;
          this.errorQna = true;
          this.initForm();
          this.cdr.detectChanges();
        }
      });
  }

  private toAaaaqq (calendario: Calendario): string  {
    const qnaPadded = calendario.qna.toString().padStart(2, '0');
    return `${calendario.ejercicio}${qnaPadded}`;
  }

  get f(){
    return this.form.controls;
  }

  get disponiblePension(): boolean {
    if (this.guardando || this.cargandoQna || this.errorQna) return false;
      const forma = this.form.get('formaAplicacion')?.value;
      if (forma === 'P') {
        return this.porcentajeDisponible > 0;
      }
      return true;
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
    const targetRFC  = esRFC(q)  ? 'RFC'  : null;
    const targetCURP = esCURP(q) ? 'CURP' : null;
    if (q.length < 3 && !esRFC(q) && !esCURP(q)) {
      this.resultados = [];
      this.cargandoBusqueda = false;
      this.toastService.warning('Búsqueda inválida', 'Captura al menos 3 caracteres para buscar.', 4000)
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
    this.cargarPorcentajeDisponible(emp.id);
    const rfc = (emp.rfc ?? emp.RFC ?? '').toString().trim();
    this.empleadoRfc = rfc || null;
    if (rfc) {
      this.cargarLiquidoByRfc(rfc);
    }
  }

  cargarLiquidoByRfc(rfc: string): void {
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

  renderChartFromDisponible(): void {
    this.chartOptions.series = [this.porcentajeDisponible];
    this.chartOptions = withChartPercent(this.chartOptions, this.porcentajeDisponible);
    if(this.chartComponent ) {
      this.chartComponent.updateSeries([this.porcentajeDisponible], true);
    }
    this.cdr.detectChanges();
  }

  cargarPorcentajeDisponible(empleadoId: number): void {
    this.pensionAlimenticiaService.getBeneficiaryByEmployee(empleadoId)
      .subscribe({
        next: (resp) => {
          const disponible = Number(resp.data?.porcentajeDisponible ?? 100);
          this.porcentajeDisponible = Math.max(0, disponible);
          this.renderChartFromDisponible();
        },
        error: () => {
          this.porcentajeDisponible = 100;
          this.renderChartFromDisponible();
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
    this.pensionAlimenticiaService.getBancos().subscribe({
      next: (response: ApiResponse<Banco[]>) => {
        this.bancos = response.data;
      },
      error: () => {
        this.toastService.error('Error', 'Error al  cargar bancos', 4000)
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
      if (!['P','C'].includes(value.formaAplicacion)) return fail('Selecciona la forma de aplicación.');
      if (value.factorImporte == null) return fail('Captura Factor/Importe.');
      
      if(value.formaAplicacion === 'C') {
        if(!value.factorImporte || Number(value.factorImporte) <= 0) {
          return fail('El importe quincenal es requerido para Importe fijo');
        }
        if(value.importeTotal && Number(value.importeTotal) > 0 && Number(value.factorImporte) > Number(value.importeTotal)) {
          return fail('El importe quincenal debe ser menor o igual al tope máximo total');
        }
      }
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
            if (!(factor > 0 && factor <= 100)) {
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
            formaAplicacion: value.formaAplicacion as 'P' | 'C',
            tipoPorcentaje: value.formaAplicacion === 'P' ? value.tipoPorcentaje : undefined,
            tipoBase: value.tipoPorcentaje === 1 ? value.tipoBase : undefined,
            factorImporte: Number(value.factorImporte),
            importeTotal: value.importeTotal ? Number(value.importeTotal) : null,
            qnaini: Number(value.vigenciaInicio),
            qnafin: 999999,
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

  resetForm () {
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
        vigenciaInicio: this.calendarioActual ? this.toAaaaqq(this.calendarioActual) : '',
        importeTotal: null,
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
        vigenciaInicio: this.calendarioActual ? this.toAaaaqq(this.calendarioActual) : '',
        importeTotal: null,
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
    if (formaAplicacion === 'C') {
      if (valor < 0) valor = 0;
      this.form.get('factorImporte')?.setValue(Number(valor.toFixed(2)));
    }
  }

  onFormaChange() {
    this.form.get('factorImporte')?.setValue(null);
    this.form.get('tipoPorcentaje')?.setValue(null);
    this.form.get('tipoBase')?.setValue(null);
    const formaAplicacion = this.form.get('formaAplicacion')?.value;
    const importeTotal = this.form.get('importeTotal');
    this.renderChartFromDisponible();
    this.baseCalculo = null; 

    if (formaAplicacion === 'C') {
      importeTotal?.enable();
      importeTotal?.setValidators([Validators.required, Validators.min(1)]);
    } else {
      importeTotal?.clearValidators();
      importeTotal?.reset();
      importeTotal?.disable();
    }
    importeTotal?.updateValueAndValidity();
    this.cdr.detectChanges();
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
      const disponibleReal = this.porcentajeDisponible;
      if (numero > disponibleReal) {
        numero = disponibleReal;
      }
      this.form.get('factorImporte')?.setValue(numero, {
        emitEvent: false
      });

      const previewDisponible = Math.max(0, disponibleReal - numero);
      this.chartOptions = withChartPercent(this.chartOptions, previewDisponible);

      if (this.chartComponent) {
        this.chartComponent.updateSeries([previewDisponible], true);
        this.chartComponent.updateOptions({
          colors: this.chartOptions.colors
        }, true);
      }
      this.cdr.detectChanges();

    } else {
      let numero = Number(factorImporte);
      if (isNaN(numero)) {
        return;
      }
      if (numero < 0) {
        numero = 0;
      }

      if (Number(factorImporte) !== numero) {
        this.form.get('factorImporte')?.setValue(numero, {
          emitEvent: false
        });
      }
    }
  }

  recalcularDisponible() {
    const acumulado = this.beneficiariosCapturados.reduce((a, b) => a + b,  0);
    this.porcentajeDisponible = Math.max(0, this.porcentajeTotal - acumulado);
  }

  onAplicarDescuentoChange() {
    const checked = this.form.get('aplicarDescuento')?.value;
    const monto = this.form.get('montoTotal');
    if (!monto) return;
    if (checked) {
      monto.enable();
      monto.setValidators([Validators.min(1)]);

    } else {
      monto.clearValidators();
      monto.reset();
      monto.disable();
    }
    monto.updateValueAndValidity();
    this.cdr.detectChanges();
  }
}

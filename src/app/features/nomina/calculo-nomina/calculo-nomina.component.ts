import { ChangeDetectorRef, ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { buildQnaCode } from '../../../shared/helpers/nomina.helper';
import { getCurrentQna } from '../../../shared/validators/validaciones.validators';
import { Calendario } from '../../../core/model/calendario.model';
import { CalendarioService } from '../../../core/services/calendario.service';
import { ConceptoExtra } from '../../../core/model/concepto-extra.model';
import { StepExecution } from '../../../core/model/step-execution.model';
import { DateYearsHelper } from '../../../shared/helpers/date-years.helper';
import { ToastService } from '../../../core/services/toast.service';
import { PayrollJobService } from '../../../core/services/payroll.service';

@Component({
  selector: 'app-calculo-nomina',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    MatButtonModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatStepperModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MatCheckboxModule,
  ],
  templateUrl: './calculo-nomina.component.html',
  styleUrls: ['./calculo-nomina.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'ngSkipHydration': 'true' }
})
export class CalculoNominaComponent implements OnInit {

  private readonly calendarioService = inject(CalendarioService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly payrollJobService = inject(PayrollJobService);
  readonly toastService = inject(ToastService);

  readonly buildQnaCode = buildQnaCode;
  readonly form: FormGroup = this.fb.group({
    anio: [null, Validators.required],
    quincena: [null, Validators.required]
  });

  readonly fechaCaptura: string = new Date().toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  readonly qnaActual: string = (() => {
    const { anio, qna } = getCurrentQna();
    return `${qna.toString().padStart(2, '0')} / ${anio}`;
  })();

  readonly stepsWithProgress: { label: string; progress: number }[];
  readonly DateYearsHelper = DateYearsHelper;

  // --- Estado local (UI del formulario/calendario, no del job) ---
  calendarioActual: Calendario | null = null;
  cargandoCalendario = false;
  conceptosExtra: ConceptoExtra[] = [];
  conceptoSeleccionado = new Set<string>();
  showSteps = false;

  // --- Estado sincronizado desde PayrollJobService.state$ ---
  progress = 0;
  processing = false;
  deliverableReady = false;
  executionHistory = new Map<number, StepExecution>();
  failedStepIndex: number | null = null;
  failedStepName: string | null = null;
  errorMessage: string | null = null;
  errorType: string | null = null;
  userMessage: string | null = null;
  totalDurationMs = 0;

  // --- Derivado localmente del progress recibido ---
  currentStepIdx = 0;

  private readonly steps = [
    { label: 'Inicializando proceso' },
    { label: 'Insertando nómina cheque plaza' },
    { label: 'Insertando nómina cheque concepto' },
    { label: 'Calculando concepto H0' },
    { label: 'Calculando nómina cheque concepto 38' },
    { label: 'Calculando concepto E2' },
    { label: 'Calculando concepto informados' },
    { label: 'Calculando concepto quinquenios' },
    { label: 'Calculando nómina cheque concepto 14 sustítuto gravidez' },
    { label: 'Calculando nómina cheque concepto 15 sustítuto pre-pensionaria' },
    { label: 'Calculando nómina cheque concepto primas' },
    { label: 'Calculando concepto 01' },
    { label: 'Calculando concepto 02' },
    { label: 'Calculando concepto 04' },
    { label: 'Calculando concepto 58' },
    { label: 'Calculando concepto 77' },
    { label: 'Calculando concepto 62' },
    { label: 'Calculando deducciones informadas' },
    { label: 'Calculando bonos BA' },
    { label: 'Calculando bonos BE' },
    { label: 'Calculando bonos BI' },
    { label: 'Calculando bonos CU' },
    { label: 'Calculando bonos DM' },
    { label: 'Calculando bonos FA' },
    { label: 'Calculando bonos GT' },
    { label: 'Calculando bonos IC' },
    { label: 'Calculando bonos IH' },
    { label: 'Calculando bonos OF' },
    { label: 'Calculando bonos RM' },
    { label: 'Preparando descuentos de pensiones alimenticias' },
    { label: 'Consolidando pensiones alimenticias' },
    { label: 'Preparando descuentos de juicios mercantiles' },
    { label: 'Consolidando juicios mercantiles' },
    { label: 'Actualizando importes' },
    { label: 'Actualizando importes finales' },
  ];

  constructor() {
    const total = this.steps.length;
    this.stepsWithProgress = this.steps.map((step, i) => ({
      ...step,
      progress: Math.round(((i + 1) / total) * 99)
    }));
  }

  ngOnInit(): void {
    this.cargarCalendarioActual();
    this.cargarConceptosExtra();
    this.subscribeToJobState();
  }

  private subscribeToJobState(): void {
    this.payrollJobService.state
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(state => {
        this.progress = state.progress;
        this.processing = state.processing;
        this.deliverableReady = state.deliverableReady;
        this.executionHistory = new Map(state.executionHistory);
        this.failedStepIndex = state.failedStepIndex;
        this.failedStepName = state.failedStepName;
        this.errorMessage = state.errorMessage;
        this.errorType = state.errorType;
        this.userMessage = state.userMessage;
        this.totalDurationMs = state.totalDurationMs;

        if (state.failedStepIndex !== null) {
          this.currentStepIdx = state.failedStepIndex;
        } else {
          this.recomputeStepIndex();
        }

        this.cdr.markForCheck();
      });
  }

  get qnaDisplay(): string {
    if (!this.calendarioActual) return this.qnaActual;
    return `${this.calendarioActual.qna.toString().padStart(2, '0')} / ${this.calendarioActual.ejercicio}`;
  }

  private cargarCalendarioActual(): void {
    this.cargandoCalendario = true;
    this.calendarioService.getQnaActiva()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resp: any) => {
          this.calendarioActual = resp?.data ?? null;
          this.cargandoCalendario = false;
          if (this.calendarioActual) {
            this.form.patchValue({
              anio: this.calendarioActual.ejercicio,
              quincena: this.calendarioActual.qna
            });
          }
          this.cdr.markForCheck();
        },
        error: () => {
          this.cargandoCalendario = false;
          this.toastService.error('Calendario', 'Error al cargar el calendario', 6000);
          this.cdr.markForCheck();
        }
      });
  }

  private cargarConceptosExtra(): void {
    this.calendarioService.getConceptosExtra()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          this.conceptosExtra = res.data ?? [];
          this.conceptoSeleccionado = new Set(
            this.conceptosExtra.map(c => c.catConceptoCve + c.catModeloId)
          );
          this.cdr.markForCheck();
        },
        error: () => {
          this.toastService.error('Conceptos extra', 'Error al cargar conceptos extra', 6000);
          this.cdr.markForCheck();
        }
      });
  }

  toggleConcepto(key: string): void {
    if (this.conceptoSeleccionado.has(key)) {
      this.conceptoSeleccionado.delete(key);
    } else {
      this.conceptoSeleccionado.add(key);
    }
    this.cdr.markForCheck();
  }

  isConceptoSeleccionado(key: string): boolean {
    return this.conceptoSeleccionado.has(key);
  }

  getExecution(stepIndex: number) {
    return this.executionHistory.get(stepIndex);
  }

  get totalDurationFormatted(): string {
    if (!this.totalDurationMs) {
      return '';
    }
    return DateYearsHelper.formatDuration(this.totalDurationMs);
  }

  get currentStepIndex(): number {
    return this.currentStepIdx;
  }

  executePayrollProcess(): void {
    const { anio, quincena } = this.form.value;
    const qnaProceso = buildQnaCode(anio, quincena);
    this.payrollJobService.start(qnaProceso);
  }

  private recomputeStepIndex(): void {
    const steps = this.stepsWithProgress;
    const nextIncomplete = steps.findIndex((s) => this.progress < s.progress);
    if (nextIncomplete === -1) {
      this.currentStepIdx = steps.length - 1;
    } else if (nextIncomplete === 0) {
      this.currentStepIdx = 0;
    } else {
      this.currentStepIdx = nextIncomplete;
    }
  }
}
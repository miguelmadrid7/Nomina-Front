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

  cargandoQna = false;

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

  calendarioActual: Calendario | null = null;
  cargandoCalendario = false;
  conceptosExtra: ConceptoExtra[] = [];
  conceptoSeleccionado = new Set<string>();
  showSteps = false;
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
  currentStepIdx = 0;

  private readonly steps = [
    { label: 'Inicializando proceso' },                         // nom_cheque_truncate
    { label: 'Insertando nómina cheque plaza' },                // nom_cheque_pza_insert
    //{ label: 'Insertando nómina cheque concepto' },           // nom_cheque_cpto_tab
    { label: 'Calculando nómina cheque concepto 07' },          // nom_cheque_cpto_p_07
    { label: 'Calculando nómina cheque concepto 35' },          // nom_cheque_cpto_p_35
    { label: 'Calculando nómina cheque concepto 38' },          // nom_cheque_cpto_p_38
    { label: 'Calculando nómina cheque concepto 39' },          // nom_cheque_cpto_p_39
    { label: 'Calculando nómina cheque concepto 44' },          // nom_cheque_cpto_p_44
    { label: 'Calculando nómina cheque concepto 46' },          // nom_cheque_cpto_p_46
    { label: 'Calculando nómina cheque concepto CP' },          // nom_cheque_cpto_p_CP
    { label: 'Calculando nómina cheque concepto CT' },          // nom_cheque_cpto_p_CT
    { label: 'Calculando nómina cheque concepto ET' },          // nom_cheque_cpto_p_ET
    { label: 'Calculando nómina cheque concepto H3' },          // nom_cheque_cpto_p_H3
    { label: 'Calculando nómina cheque concepto MB' },          // nom_cheque_cpto_p_MB
    { label: 'Calculando nómina cheque concepto N1' },          // nom_cheque_cpto_p_N1
    { label: 'Calculando nómina cheque concepto R9' },          // nom_cheque_cpto_p_R9
    { label: 'Calculando nómina cheque concepto SD' },          // nom_cheque_cpto_p_SD
    { label: 'Calculando nómina cheque concepto C4' },          // nom_cheque_cpto_p_C4
    { label: 'Calculando nómina cheque concepto CG' },          // nom_cheque_cpto_p_CG
    { label: 'Calculando nómina cheque concepto E9' },          // nom_cheque_cpto_p_E9
    { label: 'Calculando nómina cheque concepto D1, D2, D3, D4, D5, D6' },    // nom_cheque_cpto_p_D1_D6
    { label: 'Calculando nómina cheque concepto DO' },                        // nom_cheque_cpto_p_DO
    { label: 'Calculando nómina cheque concepto FC' },                        // nom_cheque_cpto_p_FC
    { label: 'Calculando nómina cheque concepto L1, L2, L3, LT' },            // nom_cheque_cpto_p_L1, L2, L3, LT
    { label: 'Calculando nómina cheque concepto MA' },                        // nom_cheque_cpto_p_MA
    { label: 'Calculando nómina cheque concepto ST' },                        // nom_cheque_cpto_p_ST
    { label: 'Calculando nómina cheque concepto T1, T2, T3' },                // nom_cheque_cpto_p_T1, T2, T3
    { label: 'Calculando nómina cheque concepto H0' },            // nom_cheque_cpto_p_ho
    { label: 'Calculando nómina cheque concepto E2' },            // nom_cheque_cpto_p_E2
    //{ label: 'Calculando concepto informados' },                // cpto_informados
    { label: 'Calculando nómina cheque concepto K1A, K1F' },       // nom_cheque_cpto_p_K1A, K1F
    { label: 'Calculando nómina cheque concepto K1' },            // nom_cheque_cpto_p_K1
    { label: 'Calculando nómina cheque concepto O1' },            // nom_cheque_cpto_p_O1
    { label: 'Calculando nómina cheque concepto KW' },            // nom_cheque_cpto_p_KW
    { label: 'Calculando nómina cheque concepto I2' },            // nom_cheque_cpto_p_I2
    { label: 'Calculando nómina cheque concepto I4' },            // nom_cheque_cpto_p_I4
    { label: 'Calculando nómina cheque concepto H2' },            // nom_cheque_cpto_p_H2
    { label: 'Calculando nómina cheque concepto H4' },            // nom_cheque_cpto_p_H4
    { label: 'Calculando nómina cheque concepto E5' },            // nom_cheque_cpto_p_E5
    { label: 'Calculando nómina cheque concepto 71' },            // nom_cheque_cpto_p_71
    { label: 'Calculando nómina cheque concepto quinquenios Q1, Q5' },           // nom_cheque_cpto_quinquenios_q1_q5
    { label: 'Calculando nómina cheque concepto quinquenios A1, A5' },           // nom_cheque_cpto_quinquenios_a1_a5
    { label: 'Calculando nómina cheque concepto 14 sustítuto gravidez' },        // nom_cheque_cpto_14
    { label: 'Calculando nómina cheque concepto 15 sustítuto pre-pensionaria' }, // nom_cheque_cpto_15
    { label: 'Calculando nómina cheque concepto primas' },                       // nom_cheque_cpto_primas
    { label: 'Calculando nómina cheque concepto 01' },            // nom_cheque_cpto_01
    { label: 'Calculando nómina cheque concepto 02' },            // nom_cheque_cpto_02
    { label: 'Calculando nómina cheque concepto 04' },            // nom_cheque_cpto_04
    { label: 'Calculando nómina cheque concepto 58' },            // nom_cheque_cpto_58
    { label: 'Calculando nómina cheque concepto 77' },            // nom_cheque_cpto_77
    { label: 'Calculando nómina cheque concepto 62' },            // nom_cheque_cpto_62
    { label: 'Preparando descuentos de pensiones alimenticias' }, // nom_cheque_cpto_62
    { label: 'Consolidando pensiones alimenticias' },             // cpto_62
    { label: 'Preparando descuentos de juicios mercantiles' },    // cpto_JM
    { label: 'Consolidando juicios mercantiles' },                // cpto_JM 
    { label: 'Calculando nómina cheque concepto 19' },            // nom_cheque_cpto_19
    { label: 'Calculando deducciones informadas' },               // deducciones informadas
    { label: 'Calculando nómina cheque bonos BA' },               // nom_cheque_cpto_bono_BA
    { label: 'Calculando nómina cheque bonos BE' },               // nom_cheque_cpto_bono_BE
    { label: 'Calculando nómina cheque bonos BI' },               // nom_cheque_cpto_bono_BI
    { label: 'Calculando nómina cheque bonos CU' },               // nom_cheque_cpto_bono_CU
    { label: 'Calculando nómina cheque bonos DM' },               // nom_cheque_cpto_bono_DM
    { label: 'Calculando nómina cheque bonos FA' },               // nom_cheque_cpto_bono_FA
    { label: 'Calculando nómina cheque bonos GT' },               // nom_cheque_cpto_bono_GT
    { label: 'Calculando nómina cheque bonos IC' },               // nom_cheque_cpto_bono_IC
    { label: 'Calculando nómina cheque bonos IH' },               // nom_cheque_cpto_bono_IH
    { label: 'Calculando nómina cheque bonos OF' },               // nom_cheque_cpto_bono_OF
    { label: 'Calculando nómina cheque bonos RM' },               // nom_cheque_cpto_bono_RM
    { label: 'Actualizando importes' },                           // updateImportes
    { label: 'Actualizando importes finales' },                   // updateImportes
  ];

  constructor() {
    const total = this.steps.length;
    this.stepsWithProgress = this.steps.map((step, i) => ({
      ...step,
      progress: Math.round(((i + 1) / total) * 99)
    }));
  }

  ngOnInit(): void {
    this.loadCurrentCalendar();
    this.loadExtraConcepts();
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

  loadCurrentCalendar(): void {
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

  loadExtraConcepts(): void {
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

  toggleConcept(key: string): void {
    if (this.conceptoSeleccionado.has(key)) {
      this.conceptoSeleccionado.delete(key);
    } else {
      this.conceptoSeleccionado.add(key);
    }
    this.cdr.markForCheck();
  }

  isConceptSelected(key: string): boolean {
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
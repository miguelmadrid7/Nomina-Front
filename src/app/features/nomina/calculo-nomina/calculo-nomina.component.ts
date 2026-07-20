import { ChangeDetectorRef, ChangeDetectionStrategy, Component, NgZone, inject, OnInit } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { NominaService } from '../../../core/services/nomina-ordinaria.service';
import { environment } from '../../../../environments/environment';
import SockJS from 'sockjs-client';
import * as Stomp from 'stompjs';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { buildQnaCode } from '../../../shared/helpers/nomina.helper';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { getCurrentQna } from '../../../shared/validators/validaciones.validators';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Calendario } from '../../../core/model/calendario.model';
import { CalendarioService } from '../../../core/services/calendario.service';
import { ConceptoExtra } from '../../../core/model/concepto-extra.model';
import { ProgressMessage } from '../../../core/model/progress-message.model';
import { StepExecution } from '../../../core/model/step-execution.model';
import { DateYearsHelper } from '../../../shared/helpers/date-years.helper';
import { ToastService } from '../../../core/services/toast.service';

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
  styleUrls:[ './calculo-nomina.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'ngSkipHydration': 'true' }
})
export class CalculoNominaComponent implements OnInit {

  private readonly nominaService = inject(NominaService);
  private readonly calendarioService = inject(CalendarioService)
  private readonly zone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly fb = inject(FormBuilder);
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
  executionHistory = new Map<number, StepExecution>();

  progress = 0;
  processing = false;
  deliverableReady = false;
  currentStepIdx = 0;
  calendarioActual: Calendario | null = null;
  cargandoCalendario = false;
  conceptosExtra: ConceptoExtra[] = [];
  conceptoSeleccionado = new Set<string>();
  showSteps = false;
  failedStepIndex: number | null = null;
  failedStepName: string | null = null;
  totalDurationMs = 0;

  private stompClient: any;
  private readonly steps = [
    { label: 'Inicializando proceso' },             // truncate
    { label: 'Insertando nómina cheque plaza' },    // insertNomChequePza
    { label: 'Insertando nómina cheque concepto' }, // insertNomChequeCptoTab
    { label: 'Calculando concepto H0' },            // cpto_ho
    { label: 'Calculando nómina cheque concepto 38' }, // nom_cheque_cpto_38
    { label: 'Calculando concepto E2' },            // cpto_E2
    { label: 'Calculando concepto informados' },    // cpto_informados
    { label: 'Calculando concepto quinquenios' },   // cpto_quinquenios
    { label: 'Calculando nómina cheque concepto 14 sustítuto gravidez' }, // nom_cheque_cpto_14
    { label: 'Calculando nómina cheque concepto 15 sustítuto pre-pensionaria' }, // nom_cheque_cpto_15
    { label: 'Calculando nómina cheque concepto primas' }, // nom_cheque_cpto_primas
    { label: 'Calculando concepto 01' },            // cpto_01
    { label: 'Calculando concepto 02' },            // cpto_02
    { label: 'Calculando concepto 04' },            // cpto_04
    { label: 'Calculando concepto 58' },            // cpto_58
    { label: 'Calculando concepto 77' },            // cpto_77
    { label: 'Calculando concepto 62' },            // cpto_62
    { label: 'Calculando deducciones informadas' }, // deducciones informadas
    { label: 'Calculando bonos BA' },               // bono_BA
    { label: 'Calculando bonos BE' },               // bono_BE
    { label: 'Calculando bonos BI' },               // bono_BI
    { label: 'Calculando bonos CU' },               // bono_CU
    { label: 'Calculando bonos DM' },               // bono_DM
    { label: 'Calculando bonos FA' },               // bono_FA
    { label: 'Calculando bonos GT' },               // bono_GT
    { label: 'Calculando bonos IC' },               // bono_IC
    { label: 'Calculando bonos IH' },               // bono_IH
    { label: 'Calculando bonos OF' },               // bono_OF
    { label: 'Calculando bonos RM' },               // bono_RM
    { label: 'Actualizando importes' },               // bono_RM
    { label: 'Preparando descuentos de pensiones alimenticias' }, // cpto_62
    { label: 'Consolidando pensiones alimenticias' }, // cpto_62
    { label: 'Actualizando importes finales' },      // updateImportes
  ];

  ngOnInit(): void {
    this.cargarCalendarioActual();
    this.cargarConceptosExtra();
  }

  get qnaDisplay(): string {
    if (!this.calendarioActual) return this.qnaActual;
    return `${this.calendarioActual.qna.toString().padStart(2, '0')} / ${this.calendarioActual.ejercicio}`;
  }

  private cargarCalendarioActual(): void {
    this.cargandoCalendario = true;
    this.calendarioService.getQnaActiva()
      .subscribe({
        next: (resp: any) => {
          this.calendarioActual = resp?.data ?? null;
          this.cargandoCalendario = false;
          if (this.calendarioActual) {
            this.form.patchValue({
              anio: this.calendarioActual.ejercicio,
              quincena: this.calendarioActual.qna
            })

          }
          this.cdr.markForCheck();
        },
        error: () => {
          this.cargandoCalendario = false;
          this.toastService.error(
            'Calendario', 
            'Error al cargar el calendario'
          );
          this.cdr.markForCheck();
        }
      });
  }

  private cargarConceptosExtra(): void {
    this.calendarioService.getConceptosExtra().subscribe({
      next: (res: any) => {
        this.conceptosExtra = res.data ?? [];
        this.conceptoSeleccionado = new Set(
          this.conceptosExtra.map(c => c.catConceptoCve + c.catModeloId)
        );
        this.cdr.markForCheck();
      },
      error: () => {
        this.toastService.error(
          'Conceptos extra', 
          'Error al cargar conceptos extra'
        );
      this.cdr.markForCheck();
      }
    })
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

  constructor() {
    const total = this.steps.length;
    this.stepsWithProgress = this.steps.map((step, i) => ({
      ...step,
      progress: Math.round(((i + 1) / total) * 99)
    }));
  }

  private subscribeToJob(jobId: number): void {
    this.stompClient.subscribe(`/topic/payroll/${jobId}`, (message: any) => {
      const data = JSON.parse(message.body);
      this.zone.run(() => this.handleProgressUpdate(data));
    });

    let intentos = 0;
    const maxIntentos = 240;
    const polling = setInterval(() => {
      intentos++;
        this.nominaService.getJobStatus(jobId).subscribe({
          next: (resp: any) => {
            const serverProgress = resp?.data?.progress ?? 0;
            const serverStatus   = resp?.data?.status   ?? '';
              this.zone.run(() => {
                if (serverProgress > this.progress) {
                  this.progress = serverProgress;
                  this.recomputeStepIndex();
                  this.cdr.detectChanges();
                }
                if (intentos >= maxIntentos || serverStatus === 'COMPLETED' || serverStatus === 'ERROR') {
                  clearInterval(polling);
                }
              });
            },
          error: () => this.zone.run(() => clearInterval(polling))
        });
      }, 500);
  }

  getExecution(stepIndex: number) {
    return this.executionHistory.get(stepIndex);
  }

  get totalDurationFormatted(): string {
    if(!this.totalDurationMs){
      return '';
    }
    return DateYearsHelper.formatDuration(this.totalDurationMs);
  }

  private handleProgressUpdate(data: ProgressMessage): void {
   this.progress = Math.max(this.progress, data.progress);
    if(data.totalDurationMs){
        this.totalDurationMs = data.totalDurationMs;
    }

    if (data.stepIndex != null && data.stepName != null && data.durationMs != null) {
      this.executionHistory.set(data.stepIndex, {
        stepName: data.stepName,
        endTime: data.endTime ?? '',
        durationMs: data.durationMs
      });
    }

    if (data.status === 'ERROR') {
      this.failedStepIndex = data.failedStepIndex ?? null;
      this.failedStepName = data.failedStepName ?? null;
      if (this.failedStepIndex !== null) {
        this.currentStepIdx = this.failedStepIndex;
      }
      this.toastService.error(
        'Proceso detenido', 
        data.errorMsg || 'Ocurrió un error en el cálculo'
      );
      this.processing = false;
      if (this.stompClient) {
        this.stompClient.disconnect(() => {});
      }
    } else {
      this.recomputeStepIndex();
    }

    if (!this.deliverableReady &&  (data.progress === 100 || data.status === 'COMPLETED')) {
      this.deliverableReady = true;
      this.processing = false;
      this.toastService.success( 
        'Proceso finalizado', 
        'El cálculo de nómina terminó correctamente.'
      );
        if (this.stompClient) {
          this.stompClient.disconnect(() => {});
        }
    }
    this.cdr.detectChanges();
  }

  get currentStepIndex(): number {
    return this.currentStepIdx;
  }

  executePayrollProcess(): void {
    const { anio, quincena } = this.form.value;
    const qnaProceso = buildQnaCode(anio, quincena);
    this.processing = true;
    this.progress = 0;
    this.deliverableReady = false;
    this.failedStepIndex = null;
    this.failedStepName = null;
    this.cdr.markForCheck();
    const ws = new SockJS(`${environment.apiUrl}/ws`);
    this.stompClient = Stomp.over(ws);
    this.executionHistory.clear();
    this.stompClient.connect(
      {},
      () => {
        this.nominaService.executePayrollProcess(qnaProceso)
          .subscribe({
            next: (resp: any) => {
              const jobId = resp?.data;
              if (!jobId) {
                this.processing = false;
                this.toastService.warning(
                  'Proceso',
                  'No se recibió el identificador del proceso.'
                );
                this.cdr.markForCheck();
                return;
              }
              this.subscribeToJob(jobId);
            },
            error: () => {
              this.processing = false;
              this.toastService.error(
                'Proceso', 
                'No se pudo iniciar el proceso. Verifica que el servidor esté disponible.'
              );
              this.cdr.markForCheck();
            }
          });
      },
      (error: any) => {
        this.zone.run(() => {
          this.processing = false;
          this.toastService.warning(
            'WebSocket', 
            'No se pudo conectar con el servidor. Verifica tu conexión o que el backend esté activo.'
          );
          this.cdr.markForCheck();
        });
      }
    );
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
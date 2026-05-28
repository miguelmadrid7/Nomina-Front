import { ChangeDetectorRef, ChangeDetectionStrategy, Component, NgZone } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
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

@Component({
  selector: 'app-calculo-nomina',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatStepperModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
],
  templateUrl: './calculo-nomina.component.html',
  styleUrls:[ './calculo-nomina.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'ngSkipHydration': 'true' }
})
export class CalculoNominaComponent {

  progress = 0;
  progressTarget = 0;
  processing = false;
  deliverableReady = false;
  private stompClient: any;
  currentStepIdx = 0;

  readonly stepsWithProgress: { label: string; progress: number }[];
  private readonly steps = [
    { label: 'Inicializando proceso' },              // truncate
    { label: 'Insertando nómina cheque plaza' },    // insertNomChequePza
    { label: 'Insertando nómina cheque concepto' },  // insertNomChequeCptoTab
    { label: 'Calculando concepto H0' },            // cpto_ho
    { label: 'Calculando concepto E2' },            // cpto_E2
    { label: 'Calculando concepto informados' },    // cpto_informados
    { label: 'Calculando concepto quinquenios' },   // cpto_quinquenios
    { label: 'Calculando nómina cheque concepto primas' }, // nom_cheque_cpto_primas
    { label: 'Calculando concepto 01' },            // cpto_01
    { label: 'Calculando concepto 02' },            // cpto_02
    { label: 'Calculando concepto 04' },            // cpto_04
    { label: 'Calculando concepto 58' },            // cpto_58
    { label: 'Calculando concepto 77' },            // cpto_77
    { label: 'Calculando concepto 62' },             // cpto_62
    { label: 'Calculando deducciones informadas' },  // deducciones informadas
    { label: 'Calculando bonos BA' },               // bono_BA
    { label: 'Calculando bonos BE' },               // bono_BE
    { label: 'Calculando bonos BI' },               // bono_BI
    { label: 'Calculando bonos DM' },               // bono_DM
    { label: 'Calculando bonos IC' },               // bono_IC
    { label: 'Calculando bonos IH' },               // bono_IH
    { label: 'Calculando bonos RM' },               // bono_RM
    { label: 'Actualizando importes' },             // updateImportes
  ];

  constructor(
    private nominaService: NominaService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef, 
    private snackBar: MatSnackBar 
  ) {
    const total = this.steps.length;
    this.stepsWithProgress = this.steps.map((step, i) => ({
      ...step,
      progress: Math.round(((i + 1) / total) * 99)
    }));
  }

  private showSnack(message: string, action: string, duration: number): void {
    this.zone.runOutsideAngular(() => {
      setTimeout(() => {
        this.zone.run(() => this.snackBar.open(message, action, { duration }));
      }, 50);
    });
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
                setTimeout(() => {
                  if (serverProgress > this.progress) {
                    this.progress = serverProgress;
                    this.recomputeStepIndex();
                    this.cdr.markForCheck();
                  }
                  if (intentos >= maxIntentos || serverStatus === 'COMPLETED' || serverStatus === 'ERROR') {
                    clearInterval(polling);
                  }
                }, 0);
              });
            },
          error: () => this.zone.run(() => clearInterval(polling))
        });
      }, 500);
  }

  private handleProgressUpdate(data: any): void {
  setTimeout(() => {
    this.progress = Math.max(this.progress, data.progress);
    this.recomputeStepIndex();
    if (data.status === 'ERROR') {
      // Mostrar error al usuario
      this.snackBar.open(data.errorMsg || 'Ocurrió un error en el cálculo', 'Cerrar', { duration: 8000 });
      this.processing = false;
      if (this.stompClient) {
        this.stompClient.disconnect(() => {});
      }
    }
    if (data.progress === 100 || data.status === 'COMPLETED') {
      this.deliverableReady = true;
      this.processing = false;
      if (this.stompClient) {
        this.stompClient.disconnect(() => {});
      }
    }
    this.cdr.markForCheck();
  }, 0);
}

  get currentStepIndex(): number {
    return this.currentStepIdx;
  }

  executePayrollProcess(): void {
    this.processing = true;
    this.progress = 0;
    this.deliverableReady = false;
    const ws = new SockJS(`${environment.apiUrl}/ws`);
    this.stompClient = Stomp.over(ws);
    this.stompClient.connect({}, () => {
      this.nominaService.executePayrollProcess(202522).subscribe({
        next: (resp: any) => {
          const jobId = resp?.data;
          if (!jobId) return;
          this.subscribeToJob(jobId);
        },
        error: () => {
          this.processing = false;
        }
      });
    });
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
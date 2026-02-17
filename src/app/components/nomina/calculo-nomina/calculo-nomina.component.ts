import { ChangeDetectorRef, Component, NgZone } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { NominaService } from '../../../services/nomina-ordinaria.service';
import { environment } from '../../../../environments/environment';
import SockJS from 'sockjs-client';
import * as Stomp from 'stompjs';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { CdkStepLabel } from "@angular/cdk/stepper";
import { HttpHeaders } from '@angular/common/http';
import { subscribe } from 'diagnostics_channel';
import { CalculationNomina } from '../../../interfaces/nomina-ordinaria-inter';

@Component({
  selector: 'app-calculo-nomina',
  imports: [
    CommonModule,
    MatButtonModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatStepperModule,
],
  templateUrl: './calculo-nomina.component.html',
  styleUrl: './calculo-nomina.component.css',
   host: { 'ngSkipHydration': 'true' }
})
export class CalculoNominaComponent {

  progress = 0;
  progressTarget = 0;
  processing = false;
  deliverableReady = false;
  private stompClient: any;
  private progressAnimationInterval: any;


  steps = [
    { label: 'Inicializando proceso', progress: 5 },
    { label: 'Truncando nómina', progress: 10 },
    { label: 'Insertando piezas', progress: 25 },
    { label: 'Insertando conceptos', progress: 40 },
    { label: 'Calculando concepto 01', progress: 55 },
    { label: 'Calculando concepto 02', progress: 70 },
    { label: 'Preparando entregable', progress: 85 },
    { label: 'Finalizando proceso', progress: 100 }
  ];

  constructor(
    private nominaService: NominaService,
    private snackBar: MatSnackBar,
    private zone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}


  private initWebSocketConnection(jobId: number): void {
    const ws = new SockJS(`${environment.apiUrl}/ws`);
    this.stompClient = Stomp.over(ws);

    this.stompClient.connect({}, () => {
      this.stompClient.subscribe(`/topic/payroll/${jobId}`, (message: any) => {
        const data = JSON.parse(message.body);
        this.zone.run(() => this.handleProgressUpdate(data));
      });
    });
  }

  private handleProgressUpdate(data: any): void {
  this.progressTarget = data.progress;

  if (data.progress === 100) {
    this.progress = 100;

    // Simulamos preparación de entregable
    setTimeout(() => {
      this.progress = 100;
      this.deliverableReady = true;
      this.processing = false;
      this.cdr.detectChanges();
    }, 1500);

    if (this.progressAnimationInterval) {
      clearInterval(this.progressAnimationInterval);
      this.progressAnimationInterval = null;
    }

    if (this.stompClient) {
      this.stompClient.disconnect(() => {});
    }

    return;
  }

  if (!this.progressAnimationInterval) {
    this.progressAnimationInterval = setInterval(() => {
      if (this.progress < this.progressTarget) {
        this.progress++;
        this.cdr.detectChanges();
      }
    }, 20);
  }
  }



  get currentStepIndex(): number {
    const raw = this.steps.findIndex(s => this.progress < s.progress);
    return raw === -1 ? this.steps.length - 1 : raw;
  }

  executePayrollProcess(): void {
    if (this.progressAnimationInterval) {
      clearInterval(this.progressAnimationInterval);
      this.progressAnimationInterval = null;
    }

    this.processing = true;
    this.progress = 0;
    this.progressTarget = 0;

    this.nominaService.executePayrollProcess(202522).subscribe({
      next: (resp: any) => {
        const jobId = resp?.data;
        if (jobId) {
          this.initWebSocketConnection(jobId);
        }
      },
      error: () => {
        this.processing = false;
      }
    });
  }

  downloadCsv(): void {

  const request: CalculationNomina = {
    qnaProceso: 202522
  };

  this.nominaService.downloadExcel(request)
    .subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'calculo_nomina.csv';
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.snackBar.open('Error al descargar el archivo', 'Cerrar', {
          duration: 3000
        });
      }
    });
  }






}

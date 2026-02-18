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
  //private progressAnimationInterval: any;


  steps = [
  { label: 'Inicializando proceso', progress: 10 },            // truncate
  { label: 'Insertando nómina cheque plaza', progress: 20 },   // insertNomChequePza
  { label: 'Insertando nómina cheque concepto', progress: 30 },// insertNomChequeCptoTab
  { label: 'Calculando concepto 01', progress: 40 },           // cpto_01
  { label: 'Calculando concepto 02', progress: 50 },           // cpto_02
  { label: 'Calculando concepto 04', progress: 60 },           // cpto_04
  { label: 'Calculando concepto H0', progress: 65 },           // cpto_ho
  { label: 'Calculando concepto informados', progress: 72 },   // cpto_informados
  { label: 'Calculando concepto quinquenios', progress: 82 },  // cpto_quinquenios
  { label: 'Calculando primas', progress: 92 },                // primas
  { label: 'Actualizando importes', progress: 95 },            // updateImportes
  { label: 'Preparando entregable', progress: 98 },            // preparar
  { label: 'Finalizando proceso', progress: 99 },              // complete (previo al 100)
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
    this.progress = data.progress;

    if (data.progress === 100 || data.status === 'COMPLETED') {
      this.deliverableReady = true;
      this.processing = false;

      if (this.stompClient) {
        this.stompClient.disconnect(() => {});
      }
    }

    this.cdr.detectChanges();
  }


  get currentStepIndex(): number {
    const raw = this.steps.findIndex(s => this.progress < s.progress);
    return raw === -1 ? this.steps.length - 1 : raw;
  }

  executePayrollProcess(): void {
  this.processing = true;
  this.progress = 0;
  this.deliverableReady = false;

  this.nominaService.executePayrollProcess(202522).subscribe({
    next: (resp: any) => {
      const jobId = resp?.data;
      if (jobId) this.initWebSocketConnection(jobId);
    },
    error: () => {
      this.processing = false;
    }
  });
  }

 downloadCsv(): void {
  const request: CalculationNomina = { qnaProceso: 202522 };

  this.nominaService.downloadCalculoCsv(request).subscribe({
    next: (resp) => {
      if (resp.status === 204 || !resp.body || resp.body.size === 0) {
        this.snackBar.open('No hay información para exportar', 'Cerrar', { duration: 3000 });
        return;
      }
      const cd = resp.headers.get('Content-Disposition') || '';
      const match = /filename\\s*=\\s*\"?([^\";]+)\"?/i.exec(cd);
      const filename = match ? match[1] : 'calculo_nomina.csv';

      const url = window.URL.createObjectURL(resp.body);
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      window.URL.revokeObjectURL(url);
    },
    error: () => {
      this.snackBar.open('Error al descargar el archivo', 'Cerrar', { duration: 3000 });
    }
  });
}
}

import { Component, OnInit, AfterViewInit, ViewChild, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { NominaService } from '../../services/nomina-ordinaria.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NominaordConceptoDialog } from '../nominaord-concepto-dialog/nominaord-concepto-dialog';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import * as Stomp from 'stompjs';
import SockJS from 'sockjs-client';
import { environment } from '../../../environments/environment';
import { MatStepperModule } from '@angular/material/stepper';

@Component({
  selector: 'app-nomina-ordinaria',
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOption,
    MatDialogModule,
    MatInputModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatStepperModule
  ],
  templateUrl: './nomina-ordinaria.html',
  styleUrl: './nomina-ordinaria.css',
  host: { 'ngSkipHydration': 'true' }
})
export class NominaOrdinaria implements OnInit, AfterViewInit {
  dataSource = new MatTableDataSource<any>([]);
  displayedColumns: string[] = ['curp', 'rfc', 'nombreEmpleado', 'qnaProceso', 'nivelSueldo', 'concepto', 'totalImporteQnal'];
  filterValues = { curp: '', rfc: '', nombreEmpleado: ''};

  anios: number[] = [2026, 2025, 2024];
  quincenas: number[] = Array.from({ length: 24 }, (_, i) => i + 1);

  anioSeleccionado = 2026;
  quincenaSeleccionada = 1;

  qnaProceso!: number;
  empleadoId?: number;
  nivelSueldo?: number;
  concepto?: string[];
  tipoConcepto?: string;
  totalElements = 0;

  showRecords = false;

  loading = false;
  progress = 0;

  processing = false;
  steps = [
    { label: 'Inicializando proceso', progress: 10 },
    { label: 'Truncando nómina', progress: 25 },
    { label: 'Insertando piezas', progress: 40 },
    { label: 'Insertando conceptos', progress: 55 },
    { label: 'Calculando concepto 01', progress: 70 },
    { label: 'Calculando concepto 02', progress: 85 },
    { label: 'Finalizando proceso', progress: 100 }
  ];



  private stompClient: any;
  private wsSubscription?: Subscription;
  private progressTarget = 0;
  private progressAnimationInterval: any;
  private readonly maxMs = 5 * 60 * 1000; // 5 min

  // Control de refrescos y QNA
  private isRefreshing = false;
  private filtersReady = false;
  private lastQnaKey: string | null = null;
  private qnaDebounceId: any;

  // Control de estancamiento del progreso del job
  private lastJobProgress: number | null = null;
  private stagnantCount = 0;
  private readonly maxStagnant = 30; // 30 ciclos ~ 30s si intervalo=1s

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private nominaService: NominaService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {}

  ngOnInit(): void {
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      const search = JSON.parse(filter);
      const curp = (data.curp ?? '').toString().toUpperCase();
      const rfc = (data.rfc ?? '').toString().toUpperCase();
      const nombre = (data.nombreEmpleado ?? '').toString().toUpperCase();
      return (
        nombre.includes(search.nombreEmpleado) &&
        curp.includes(search.curp) &&
        rfc.includes(search.rfc)
      );
    };
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.paginator) {
        this.dataSource.paginator = this.paginator;
      }
    }, 0);
  }

  private ensurePaginatorBoundSoon(): void {
    setTimeout(() => {
      if (this.paginator && this.dataSource.paginator !== this.paginator) {
        this.dataSource.paginator = this.paginator;
      }
    }, 0);
  }

  onQnaModelChange(): void {
    if (!this.showRecords || !this.filtersReady) return;
    clearTimeout(this.qnaDebounceId);
    this.qnaDebounceId = setTimeout(() => {
      const key = `${this.anioSeleccionado}-${this.quincenaSeleccionada}`;
      if (this.lastQnaKey !== key && !this.isRefreshing) {
        this.lastQnaKey = key;
        this.refresh();
      }
    }, 0);
  }

  showRecordsTable(): void {
    this.showRecords = true;
    this.ensurePaginatorBoundSoon();
    this.filtersReady = false;
    setTimeout(() => {
      this.filtersReady = true;
      this.refresh();
    }, 0);
  }

  hideRecordsTable(): void {
    this.disconnectWebSocket();
    this.processing = false;
    this.loading = false;

    this.showRecords = false;
    this.clearTable();
  }

  private refreshIfQnaChanged(): void {
    const key = `${this.anioSeleccionado}-${this.quincenaSeleccionada}`;
    if (this.lastQnaKey === key || this.isRefreshing) return;
    this.lastQnaKey = key;
    this.refresh();
  }

  refresh(): void {
    const qna = this.anioSeleccionado && this.quincenaSeleccionada
      ? parseInt(`${this.anioSeleccionado}${this.quincenaSeleccionada.toString().padStart(2,'0')}`, 10)
      : null;

    if (!qna) {
      this.dataSource.data = [];
      this.totalElements = 0;
      this.clearTable();
      return;
    }
    this.qnaProceso = qna;

    // Fija la llave aquí para evitar doble refresh al primer render
    this.lastQnaKey = `${this.anioSeleccionado}-${this.quincenaSeleccionada}`;

    this.fetchNomina();
  }

  private clearTable(): void {
    this.dataSource.data = [];
    this.totalElements = 0;
  }

  private pickConcept(conceptos: any[], target: number): any | null {
    if (!Array.isArray(conceptos) || conceptos.length === 0) return null;
    return conceptos[0];
  }

  private isApplicableConcept(c: any, target: number): boolean {
    return true;
  }

  private adaptResponse(items: any[], target: number): any[] {
    return (items ?? [])
      .map(item => {
        const conceptos = item?.conceptos ?? [];
        const concept = this.pickConcept(conceptos, target);
        if (!concept || !this.isApplicableConcept(concept, target)) return null;
        return {
          empleadoId: item.tabEmpleadosId,
          nombreEmpleado: item.nombreEmpleado,
          qnaProceso: target,
          curp: item.curp,
          rfc: item.rfc,
          nivelSueldo: concept?.catCategoriasCve ?? '',
          concepto: concept?.conceptoCve ?? '',
          tipoConcepto: concept?.tipoConcepto ?? (concept?.conceptoCve ?? ''),
          totalImporteQnal: item.totalImporteQnal,
          conceptos: conceptos
        };
      })
      .filter(Boolean) as any[];
  }

  private fetchNomina(): void {
    if (this.isRefreshing) return;
    this.isRefreshing = true;
    this.loading = true;
    this.progress = 0;

    this.nominaService.getCalculation({
      qnaProceso: this.qnaProceso,
      empleadoId: this.empleadoId,
      nivelSueldo: this.nivelSueldo,
      concepto: this.concepto,
      tipoConcepto: this.tipoConcepto
    })
    .subscribe({
      next: (response) => {
        this.progress = 60;
        const data = this.adaptResponse(response?.data ?? [], this.qnaProceso);
        this.dataSource.data = data;
        this.totalElements = data.length;

        this.progress = 100;
        setTimeout(() => {
          this.loading = false;
          this.progress = 0;
          this.isRefreshing = false;
        }, 300);
      },
      error: (err) => {
        console.error('Error backend (500)', err);
        this.clearTable();
        this.loading = false;
        this.progress = 0;
        this.isRefreshing = false;
      }
    });
  }

  downloadExcel(): void {
    const qna =
      this.anioSeleccionado && this.quincenaSeleccionada
        ? parseInt(`${this.anioSeleccionado}${this.quincenaSeleccionada.toString().padStart(2,'0')}`, 10)
        : null;

    if (!qna) return;
    this.nominaService.downloadExcel({
      qnaProceso: qna,
      nivelSueldo: this.nivelSueldo,
      conceptos: this.concepto,
      empleadoId: this.empleadoId,
      tipoConcepto: this.tipoConcepto
    }).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Calculo_Nomina.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Error descargando Excel', err);
      }
    });
  }

  openConceptosDialog(row: any) {
    this.dialog.open(NominaordConceptoDialog, {
      panelClass: 'nomina-dialog-wide',
      data: {
        empleadoId: row.empleadoId,
        nombreEmpleado: row.nombreEmpleado,
        qnaProceso: row.qnaProceso,
        conceptos: row.conceptos ?? [],
        curp: row.curp,
        rfc: row.rfc,
      }
    });
  }

  applyFilter(column: 'curp' | 'rfc' | 'nombreEmpleado', value: string) {
    this.filterValues[column] = (value ?? '').trim().toUpperCase();
    this.dataSource.filter = JSON.stringify(this.filterValues);
  }

  enforceUppercase(evt: Event) {
    const input = evt.target as HTMLInputElement;
    input.value = (input.value ?? '').toUpperCase();
  }

  clearFilters(): void {
    this.filterValues = { curp: '', rfc: '', nombreEmpleado: '' };
    this.dataSource.filter = JSON.stringify(this.filterValues);
    this.anioSeleccionado = 2026;
    this.quincenaSeleccionada = 1;
    if (this.showRecords) {
      this.refreshIfQnaChanged();
    }
  }

  // Agregar este método helper a la clase
private showSnack(message: string, action: string, duration: number): void {
  this.zone.runOutsideAngular(() => {
    setTimeout(() => {
      this.zone.run(() => this.snackBar.open(message, action, { duration }));
    }, 50);
  });
}

// Getter en lugar de propiedad mutable
get currentStepIndex(): number {
  const raw = this.steps.findIndex(s => this.progress < s.progress);
  return raw === -1 ? this.steps.length - 1 : raw;
}

  disconnectWebSocket(): void {
    if (this.stompClient) {
      this.stompClient.disconnect(() => {
        console.log('Disconnected WebSocket');
      });
      this.stompClient = null;
    }
  }

  initWebSocketConnection(jobId: number): void {
    const serverUrl = `${environment.apiUrl}/ws`;
    const ws = new SockJS(serverUrl);
    this.stompClient = Stomp.over(ws);

    this.stompClient.connect({}, (frame: any) => {
      this.zone.run(() => {
        this.wsSubscription = this.stompClient.subscribe(`/topic/payroll/${jobId}`, (message: any) => {
          if (message.body) {
            const data = JSON.parse(message.body);
            this.zone.run(() => this.handleProgressUpdate(data));
          }
        });
      });
    }, (error: any) => {
        console.error('WebSocket connection error:', error);
        this.zone.run(() => {
            this.processing = false;
            this.loading = false;
            this.showSnack('No se pudo conectar para ver el progreso.', 'Cerrar', 4000);
        });
    });
  }

  private handleProgressUpdate(data: any): void {
    this.progressTarget = data.progress;

    if (!this.progressAnimationInterval) {
      this.progressAnimationInterval = setInterval(() => {
        if (this.progress < this.progressTarget) {
          this.progress++;
          this.cdr.detectChanges(); // Forzar detección de cambios
        } else if (this.progress >= 100) {
          clearInterval(this.progressAnimationInterval);
          this.progressAnimationInterval = null;
          this.processing = false;
          this.loading = false;
          this.disconnectWebSocket();
          this.refresh();
          this.showSnack('Proceso completado correctamente', 'Cerrar', 3000);
        }
      }, 20); // Ajusta la velocidad de la animación aquí
    }

    if (data.status === 'ERROR') {
      clearInterval(this.progressAnimationInterval);
      this.progressAnimationInterval = null;
      this.processing = false;
      this.loading = false;
      this.disconnectWebSocket();
      this.showSnack('Error en el proceso', 'Cerrar', 4000);
    }
  }

  executePayrollProcess(): void {
    if (this.stompClient) {
      this.disconnectWebSocket();
    }

    const qna = this.anioSeleccionado && this.quincenaSeleccionada
      ? parseInt(`${this.anioSeleccionado}${this.quincenaSeleccionada.toString().padStart(2, '0')}`, 10)
      : null;

    if (!qna) {
      this.showSnack('Por favor, selecciona una quincena y año válidos.', 'Cerrar', 4000);
      return;
    }

    this.showRecords = true;
    this.processing = true;
    this.loading = true;
    this.progress = 0;
    this.progressTarget = 0;
    if (this.progressAnimationInterval) {
      clearInterval(this.progressAnimationInterval);
      this.progressAnimationInterval = null;
    }

    this.nominaService.executePayrollProcess(qna).subscribe({
      next: (resp: any) => {
        const jobId = resp?.data;
        if (jobId) {
          this.initWebSocketConnection(jobId);
        } else {
          this.processing = false;
          this.loading = false;
          this.showSnack('No se pudo iniciar el proceso.', 'Cerrar', 4000);
        }
      },
      error: (err) => {
        this.processing = false;
        this.loading = false;
        this.showSnack('Error al contactar el servidor para iniciar el proceso.', 'Cerrar', 4000);
      }
    });
  }
}

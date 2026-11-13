import { CommonModule } from '@angular/common';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { debounceTime, finalize } from 'rxjs';
import { Calendario } from '../../../core/model/calendario.model';
import { InasistenciasResponse } from '../../../core/model/response/incidencias-inasistencias/inasistencias-response.model';
import { CalendarioService } from '../../../core/services/calendario.service';
import { IncidenciasInasistenciasService } from '../../../core/services/incidencias-inasistencias.service';
import { ToastService } from '../../../core/services/toast.service';
import { DateYearsHelper } from '../../../shared/helpers/date-years.helper';
import { extractBlobErrorMessage, extractFilename, saveBlob } from '../../../shared/helpers/file-download.helper';

@Component({
  selector: 'app-historico-inasistencias',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatTableModule,
    MatPaginatorModule,
    MatSelectModule,
  ],
  templateUrl: './historico-inasistencias.html',
  styleUrl: './historico-inasistencias.css'
})
export class HistoricoInasistencias implements OnInit {

  private readonly DOWNLOAD_TOAST_ID = 5302;

  calendarioActual: Calendario | null = null;
  cargandoQna = false;
  errorQna = false;
  anios: number[] = [];
  quincenas: number[] = [];
  historico: InasistenciasResponse[] = [];
  pagedRows: InasistenciasResponse[] = [];
  cargando = false;
  totalElements = 0;
  pageSize = 10;
  pageIndex = 0;
  isDownloadingReporte = false;

  readonly displayedColumns: string[] = ['folio', 'empleado', 'plaza', 'dia', 'horas', 'importe'];

  private readonly calendarioService = inject(CalendarioService);
  private readonly inasistenciasService = inject(IncidenciasInasistenciasService);
  private readonly toastService = inject(ToastService);
  private readonly cd = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly filters = new FormGroup({
    anio: new FormControl<number | null>(null),
    quincena: new FormControl<number | null>(null),
  });

  ngOnInit(): void {
    this.anios = DateYearsHelper.getYears(1, 1);
    this.quincenas = DateYearsHelper.getQna();
    this.loadQnaActivated();
    this.filters.valueChanges
      .pipe(debounceTime(200), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.applyFilters());
  }

  /** Quincena activa en formato AAAAQQ. */
  private get qnaActiva(): number | null {
    const c = this.calendarioActual;
    if (!c?.qna || !c?.ejercicio) return null;
    return DateYearsHelper.toQnaCode(c.ejercicio, c.qna);
  }

  /** Quincena de los filtros; null si falta el año o la quincena. */
  private get qnaFiltro(): number | null {
    const { anio, quincena } = this.filters.getRawValue();
    if (!anio || !quincena) return null;
    return DateYearsHelper.toQnaCode(anio, quincena);
  }

  loadQnaActivated(): void {
    this.cargandoQna = true;
    this.errorQna = false;
    this.calendarioService.getQnaActiva()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resp) => {
          this.calendarioActual = resp?.data ?? null;
          this.cargandoQna = false;
          this.errorQna = !this.calendarioActual;
          this.cd.markForCheck();
          this.applyFilters();
        },
        error: () => {
          this.calendarioActual = null;
          this.cargandoQna = false;
          this.errorQna = true;
          this.cd.markForCheck();
        }
      });
  }

  /** Usa la quincena de los filtros o, si están incompletos, la activa. */
  applyFilters(): void {
    const qna = this.qnaFiltro ?? this.qnaActiva;
    if (!qna) return;
    this.loadHistorico(qna);
  }

  clearFilters(): void {
    this.filters.reset({ anio: null, quincena: null });
  }

  loadHistorico(qnaProceso: number): void {
    this.cargando = true;
    this.inasistenciasService.getIncidencias({ qnaProceso })
      .pipe(
        finalize(() => {
          this.cargando = false;
          this.cd.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (resp) => {
          this.historico = resp?.success ? (resp.data ?? []) : [];
          this.pageIndex = 0;
          this.refreshPage();
        },
        error: (error: HttpErrorResponse) => {
          this.historico = [];
          this.refreshPage();
          this.toastService.error('Error', error?.error?.message ?? 'No se pudo obtener el histórico.');
        }
      });
  }

  onDownloadReport(): void {
    const qna = this.qnaFiltro ?? this.qnaActiva;
    if (!qna) {
      this.toastService.error('Quincena no disponible', 'No se pudo determinar la quincena.');
      return;
    }
    this.downloadExcel(qna);
  }

  downloadExcel(qnaProceso: number): void {
    if (this.isDownloadingReporte) return;

    this.isDownloadingReporte = true;
    this.toastService.upsertPersistent(this.DOWNLOAD_TOAST_ID, 'info', 'Generando reporte', 'Preparando el archivo Excel...');
    this.inasistenciasService.descargarReporte(qnaProceso)
      .pipe(
        finalize(() => {
          this.isDownloadingReporte = false;
          this.cd.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (resp: HttpResponse<Blob>) => {
          if (resp.status === 204 || !resp.body) {
            this.toastService.resolvePersistent(this.DOWNLOAD_TOAST_ID, 'warning', 'Sin información', 'No hay inasistencias para generar el reporte.');
            return;
          }
          const filename = extractFilename(resp) ?? `inasistencias_qna${qnaProceso}.xlsx`;
          saveBlob(resp.body, filename);
          this.toastService.resolvePersistent(this.DOWNLOAD_TOAST_ID, 'success', 'Reporte descargado', `Se descargó "${filename}" correctamente.`);
        },
        error: (err: HttpErrorResponse) => {
          extractBlobErrorMessage(err, 'No fue posible generar el reporte.').subscribe((message) => {
            this.toastService.resolvePersistent(this.DOWNLOAD_TOAST_ID, 'error', 'No se pudo descargar', message);
          });
        }
      });
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.refreshPage();
  }

  private refreshPage(): void {
    this.totalElements = this.historico.length;
    const start = this.pageIndex * this.pageSize;
    this.pagedRows = this.historico.slice(start, start + this.pageSize);
  }
}
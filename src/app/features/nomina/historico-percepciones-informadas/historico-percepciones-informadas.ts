import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
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
import { HistoricoCarga } from '../../../core/model/historico-carga.model';
import { CalendarioService } from '../../../core/services/calendario.service';
import { PercepcionesInformadasService } from '../../../core/services/percepciones-informadas.service';
import { ToastService } from '../../../core/services/toast.service';
import { DateYearsHelper } from '../../../shared/helpers/date-years.helper';
import { extractBlobErrorMessage, saveBlob } from '../../../shared/helpers/file-download.helper';

@Component({
  selector: 'app-historico-percepciones-informadas',
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
  templateUrl: './historico-percepciones-informadas.html',
  styleUrl: './historico-percepciones-informadas.css'
})
export class HistoricoPercepcionesInformadas implements OnInit {

  private readonly DOWNLOAD_TOAST_ID = 5301;

  calendarioActual: Calendario | null = null;
  cargandoQna = false;
  errorQna = false;
  anios: number[] = [];
  quincenas: number[] = [];

  // full list from the backend; the table shows only the current page
  private historico: HistoricoCarga[] = [];
  pagedRows: HistoricoCarga[] = [];
  cargando = false;
  totalElements = 0;
  pageSize = 10;
  pageIndex = 0;
  isDownloadingReporte = false;

  readonly conceptos = ['ME', 'MG', 'VM', '37', 'TP', 'OA', 'OL', 'TE', '7S'];
  readonly displayedColumns: string[] = ['concepto', 'qnaProceso', 'fechaCarga', 'acciones'];

  private readonly calendarioService = inject(CalendarioService);
  private readonly percepcionesInformadasService = inject(PercepcionesInformadasService);
  private readonly toastService = inject(ToastService);
  private readonly cd = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  // all filters are optional
  readonly filters = new FormGroup({
    anio: new FormControl<number | null>(null),
    quincena: new FormControl<number | null>(null),
    concepto: new FormControl<string | null>(null),
  });

  ngOnInit(): void {
    this.anios = DateYearsHelper.getYears(1, 1);
    this.quincenas = DateYearsHelper.getQna();
    this.loadQnaActivated();
    this.filters.valueChanges
      .pipe(debounceTime(200), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.applyFilters());
  }

  // ---------- quincena ----------

  private get qnaActiva(): number | null {
    const c = this.calendarioActual;
    if (!c?.qna || !c?.ejercicio) return null;
    return Number(`${c.ejercicio}${c.qna.toString().padStart(2, '0')}`);
  }

  /** AAAAQQ from the year + quincena filters, or null if either is missing. */
  private get qnaFiltro(): number | null {
    const { anio, quincena } = this.filters.getRawValue();
    if (!anio || !quincena) return null;
    return Number(`${anio}${String(quincena).padStart(2, '0')}`);
  }

  loadQnaActivated(): void {
    this.cargandoQna = true;
    this.errorQna = false;
    this.calendarioService.getQnaActiva().subscribe({
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

  // ---------- filters and data ----------

  applyFilters(): void {
    // the endpoint requires a quincena: the selected one, or the active one
    const qna = this.qnaFiltro ?? this.qnaActiva;
    if (!qna) return;
    this.loadHistorico(qna, this.filters.controls.concepto.value);
  }

  clearFilters(): void {
    this.filters.reset({ anio: null, quincena: null, concepto: null });
  }

  loadHistorico(qnaProceso: number, concepto?: string | null): void {
    this.cargando = true;
    this.percepcionesInformadasService.getHistoric(qnaProceso, concepto)
      .pipe(finalize(() => {
        this.cargando = false;
        this.cd.markForCheck();
      }))
      .subscribe({
        next: ({ rows }) => {
          this.historico = rows;
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

  // ---------- downloads (GET /nom-emp-pza-cpto/descargar-validaciones) ----------

  /** General report with the current filters (quincena is required by the endpoint). */
  onDownloadReport(): void {
    const qna = this.qnaFiltro ?? this.qnaActiva;
    if (!qna) {
      this.toastService.error('Quincena no disponible', 'No se pudo determinar la quincena.');
      return;
    }
    this.downloadExcel(qna, this.filters.controls.concepto.value, null);
  }

  /** Report of one specific load (row). */
  onDownloadRow(row: HistoricoCarga): void {
    this.downloadExcel(row.qnaProceso, row.concepto, this.toServerDateTime(row.fechaCarga));
  }

  downloadExcel(qnaProceso: number, concepto: string | null, fechaCarga: string | null): void {
    if (this.isDownloadingReporte) return;

    this.isDownloadingReporte = true;
    this.toastService.upsertPersistent(this.DOWNLOAD_TOAST_ID, 'info', 'Generando reporte', 'Preparando el archivo Excel...');
    this.percepcionesInformadasService
      .downloadValidations(qnaProceso, concepto ?? undefined, fechaCarga ?? undefined)
      .pipe(finalize(() => {
        this.isDownloadingReporte = false;
        this.cd.markForCheck();
      }))
      .subscribe({
        next: (blob: Blob) => {
          const filename = `percepciones_qna${qnaProceso}${concepto ? '_' + concepto : ''}.xlsx`;
          saveBlob(blob, filename);
          this.toastService.resolvePersistent(this.DOWNLOAD_TOAST_ID, 'success', 'Reporte descargado', `Se descargó "${filename}" correctamente.`);
        },
        error: (err: HttpErrorResponse) => {
          extractBlobErrorMessage(err, 'No fue posible generar el reporte.').subscribe((message) => {
            this.toastService.resolvePersistent(this.DOWNLOAD_TOAST_ID, 'error', 'No se pudo descargar', message);
          });
        }
      });
  }

  /**
   * The history returns fechaCarga in UTC ("...+00:00"); the backend likely reads it as local time.
   * Convert to "yyyy-MM-ddTHH:mm:ss.SSS" in local time (assumes browser and server share time zone).
   */
  private toServerDateTime(value: string): string {
    const d = new Date(value);
    const pad = (n: number, size = 2) => String(n).padStart(size, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
      + `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
  }

  // ---------- paging ----------

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
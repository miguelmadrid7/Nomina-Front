import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Calendario } from '../../../core/model/calendario.model';
import { CalendarioService } from '../../../core/services/calendario.service';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { TerceroHistorico } from '../../../core/model/terceros/tercero-historico.model';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { TerceroService } from '../../../core/services/tercero.service';
import { finalize } from 'rxjs';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { ToastService } from '../../../core/services/toast.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { TerceroConcepto } from '../../../core/model/terceros/tercero-conceptos.model';
import { extractBlobErrorMessage, extractFilename, saveBlob } from '../../../shared/helpers/file-download.helper';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-historico-terceros',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './historico-terceros.html',
  styleUrl: './historico-terceros.css'
})
export class HistoricoTerceros implements OnInit{

  cargandoQna = false;
  calendarioActual: Calendario | null = null;
  errorQna = false;
  conceptos: TerceroConcepto[] = [];
  historico: TerceroHistorico[] = [];
  pagedRows: TerceroHistorico[] = [];
  cargando = false; 
  cargaConceptos = false;
  isDownloadingReporte = false;

  totalElements = 0;
  pageSize = 10;
  pageIndex = 0;

  readonly displayedColumns: string[] = ['concepto', 'qnaProceso', 'fechaCarga', 'acciones'];

  private readonly calendarioService = inject(CalendarioService);
  private readonly terceroService = inject(TerceroService);
  private readonly toastService = inject(ToastService);
  private readonly cd = inject(ChangeDetectorRef);

  private readonly DOWNLOAD_TOAST_ID = 5104;

  readonly form = new FormGroup({
    concepto: new FormControl<string | null>(null, [Validators.required]),
    importeDefault: new FormControl<number | null>(null, [Validators.min(0)]),
  });

  ngOnInit(): void {
    this.loadQnaActivated();
    this.cargarConceptos();
  }

  private get qnaCompleta(): number | null {
    const c = this.calendarioActual;
    if (!c?.qna || !c?.ejercicio) return null;
    return Number(`${c.ejercicio}${c.qna.toString().padStart(2, '0')}`);
  }

  cargarConceptos(): void {
    this.cargaConceptos = true;
    this.terceroService.getConcepts()
      .pipe(
        finalize(() => {
          this.cargaConceptos = false;
          this.cd.markForCheck();
        })
      )
      .subscribe({
        next: (response) => {
          if (!response.success) {
            this.conceptos = [];
            this.toastService.error('Operación invalida', response.message ?? 'No se pudieron cargar los conceptos.', 6000);
            return;
          }
          this.conceptos = [...(response.data ?? [])].sort((a, b) =>
            (a.cve ?? '').localeCompare(b.cve ?? '', 'es', { numeric: true, sensitivity: 'base' })
          );
        },
        error: (error: HttpErrorResponse) => {
          this.conceptos = [];
          this.toastService.error('Operación invalida', error?.error?.message ?? 'Error al cargar los conceptos.', 6000);
        }
      });
  }

  loadQnaActivated(): void {
    this.cargandoQna = true;
    this.errorQna = false;
    this.calendarioService.getQnaActiva().subscribe({
      next: (resp) => {
        const calendario = resp?.data ?? null;
        this.calendarioActual = calendario;
        this.cargandoQna = false;
        this.errorQna = !calendario;
        this.cd.markForCheck();

         const qna = this.qnaCompleta;
          if (qna) {
            this.loadHistorico(qna);
          }
      },
      error: () => {
        this.calendarioActual = null;
        this.cargandoQna = false;
        this.errorQna = true;
        this.cd.markForCheck();
      }
    });
  }

  loadHistorico(qnaProceso: number, concepto?: string | null): void {
      this.cargando = true;
      this.terceroService.getHistoric(qnaProceso, concepto)
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

  onDownloadReport(): void {
    const qnaProceso = this.qnaCompleta;
    if (!qnaProceso) {
      this.toastService.error('Quincena no disponible', 'No se pudo determinar la quincena activa.');
      return;
    }
    // optional: without a concepto the backend returns every concepto of the quincena
    //const concepto = this.form.controls.concepto.value;

    this.isDownloadingReporte = true;
    this.toastService.upsertPersistent(this.DOWNLOAD_TOAST_ID, 'info', 'Generando reporte', 'Preparando el archivo Excel...');
    this.terceroService.donwloadReportTerceros(qnaProceso)
      .pipe(
        finalize(() => {
          this.isDownloadingReporte = false;
          this.cd.detectChanges();
        })
      )
      .subscribe({
        next: (response: HttpResponse<Blob>) => {
          if (!response.body) {
            this.toastService.resolvePersistent(this.DOWNLOAD_TOAST_ID, 'error', 'Error al descargar', 'El servidor no devolvió ningún archivo.');
            return;
          }
          const filename = extractFilename(response) ?? `terceros_qna${qnaProceso}.xlsx`;
          saveBlob(response.body, filename);
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

  refreshPage(): void {
    this.totalElements = this.historico.length;
    const start = this.pageIndex * this.pageSize;
    this.pagedRows = this.historico.slice(start, start + this.pageSize);
  }

}

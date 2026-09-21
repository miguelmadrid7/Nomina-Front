import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, DestroyRef, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { debounceTime, distinctUntilChanged, finalize, forkJoin } from 'rxjs';
import { ToastService } from '../../../core/services/toast.service';
import { TerceroService } from '../../../core/services/tercero.service';
import { CalendarioService } from '../../../core/services/calendario.service';
import { Calendario } from '../../../core/model/calendario.model';
import { TerceroConcepto } from '../../../core/model/terceros/tercero-conceptos.model';
import { CargaTerceroResponse } from '../../../core/model/response/terceros/terceros-carga-response.model';
import { TerceroRow } from '../../../core/model/terceros/tercero-row.model';
import { ConfirmDialog } from '../../../shared/dialogs/confirm-dialog/confirm-dialog';
import { MatDialog } from '@angular/material/dialog';
import { ConsultaTercerosLotesDialog } from '../../../shared/dialogs/consulta-terceros-lotes-dialog/consulta-terceros-lotes-dialog';

const TIPO_INSTITUCIONAL = 1;
const TIPO_NO_INSTITUCIONAL = 2;
const ALLOWED_EXTENSION = '.txt';

@Component({
  selector: 'app-carga-terceros-inst-noinst',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatRadioModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './carga-terceros-inst-noinst.html',
  styleUrl: './carga-terceros-inst-noinst.css'
})
export class CargaTercerosInstNoinst implements OnInit {

  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  conceptosInstitucionalesCodigos = ['03','08','12','55','56','64','vt','sf','5l','6l','21'];
  conceptosNoInstitucionalesCodigos = ['vp','53','61','cs','ce','fj','gf','51','57','ia','ic','im','iv','np','sg','bs','br','ef','ko','lb','oh','su','tc','tm','tn'];
  conceptosInstitucionales: TerceroConcepto[] = [];
  conceptosNoInstitucionales: TerceroConcepto[] = [];
  conceptosFiltrados: TerceroConcepto[] = [];

  // file upload state
  selectedFile: File | null = null;
  isUploading = false;
  resultado: CargaTerceroResponse | null = null;
  yaSeProceso = false;

  // qna
  cargandoQna = false;
  calendarioActual: Calendario | null = null;
  errorQna = false;

  // validation
  totalRecordsCount = 0;
  validRecordCount = 0;
  isValidatingLote = false;

  editingRowId: number | null = null;

  // table (server-side paging and search)
  totalElements = 0;
  pageSize = 10;
  pageIndex = 0;

  isProcessingPayroll = false;
  private readonly PROCESS_TOAST_ID = 5102;

  dataSource = new MatTableDataSource<TerceroRow>([]);
  readonly displayedColumns: string[] = ['rfc', 'curp', 'nombreTrabajador', 'tipoMovimiento', 'importeMensual', 'conceptoDescuento', 'estatus', 'observaciones','fechaRegistro','acciones'];

  readonly TIPO_INSTITUCIONAL = TIPO_INSTITUCIONAL;
  readonly TIPO_NO_INSTITUCIONAL = TIPO_NO_INSTITUCIONAL;

  private readonly toastService = inject(ToastService);
  private readonly terceroService = inject(TerceroService);
  private readonly cd = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly calendarioService = inject(CalendarioService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);

  readonly form = new FormGroup({
    tipoConcepto: new FormControl<number>(TIPO_NO_INSTITUCIONAL, { nonNullable: true }),
    concepto: new FormControl<string | null>(null, [Validators.required]),
    importeDefault: new FormControl<number | null>(null, [Validators.min(0)]),
  });

  readonly searchForm = this.fb.group({
    searchText: [''],
  });

  get canUpload(): boolean {
    return !!this.selectedFile && this.form.valid && !this.isUploading && !this.yaSeProceso;
  }

  get validationSummaryText(): string {
    const rechazados = this.totalRecordsCount - this.validRecordCount;
    return `Aceptados: ${this.validRecordCount} · Rechazados: ${rechazados} de ${this.totalRecordsCount} registros`;
  }

  // quincena in AAAAQQ format (e.g. 202522), built from the active quincena
  private get qnaCompleta(): number | null {
    const calendario = this.calendarioActual;
    if (!calendario?.qna || !calendario?.ejercicio) {
      return null;
    }
    return Number(`${calendario.ejercicio}${calendario.qna.toString().padStart(2, '0')}`);
  }

  ngOnInit(): void {
    this.form.controls.tipoConcepto.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((tipo) => this.aplicarFiltro(tipo));
    this.form.controls.concepto.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.clearFile();
        this.resultado = null;
        this.totalRecordsCount = 0;
        this.validRecordCount = 0;
        this.totalElements = 0;
        this.pageIndex = 0;
        this.dataSource.data = [];
        this.searchForm.controls.searchText.setValue('', { emitEvent: false });
      });

    this.cargarConceptos();
    this.loadQnaActivated();
    this.setupSearch();
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
        this.cd.detectChanges();
      },
      error: () => {
        this.calendarioActual = null;
        this.cargandoQna = false;
        this.errorQna = true;
        this.cd.detectChanges();
      }
    });
  }

  cargarConceptos(): void {
    this.terceroService.obtenerConceptos().subscribe({
      next: (data: TerceroConcepto[]) => {
        const lista = data ?? [];
        this.conceptosInstitucionales = this.ordenarPorPrioridad(
          this.dedupeByCve(
            lista.filter((c) =>
              this.conceptosInstitucionalesCodigos.includes((c.cve ?? '').toLowerCase())
            )
          ),
          this.conceptosInstitucionalesCodigos
        );
        this.conceptosNoInstitucionales = this.ordenarPorPrioridad(
          this.dedupeByCve(
            lista.filter((c) =>
              this.conceptosNoInstitucionalesCodigos.includes((c.cve ?? '').toLowerCase())
            )
          ),
          this.conceptosNoInstitucionalesCodigos
        );
        // apply the filter for the currently selected radio (default: no institucionales)
        this.aplicarFiltro(this.form.controls.tipoConcepto.value);
      },
      error: () => {
        this.toastService.error('Operación invalida', 'Error al cargar los conceptos.', 6000);
      }
    });
  }

  // ---------- file selection ----------
  onTxtSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0) ?? null;
    if (!file) {
      this.selectedFile = null;
      return;
    }

    if (!this.form.controls.concepto.value) {
      this.toastService.warning('Concepto requerido', 'Selecciona un concepto antes de cargar el archivo.');
      this.clearFile();
      return;
    }

    // frontend pre-check for UX only; the backend remains authoritative
    if (!file.name.toLowerCase().endsWith(ALLOWED_EXTENSION)) {
      this.rejectFile('Solo se permiten archivos con extensión .txt.');
      return;
    }
    if (file.size === 0) {
      this.rejectFile('El archivo está vacío.');
      return;
    }

    this.selectedFile = file;
    this.resultado = null;
  }

  // ---------- upload (POST /terceros/cargar-txt) ----------
  onUploadTxt(): void {
    const file = this.selectedFile;
    const { concepto, importeDefault } = this.form.getRawValue();
    const qnaProceso = this.qnaCompleta;

    if (!qnaProceso) {
      this.toastService.error('Quincena no disponible', 'No se pudo determinar la quincena activa.');
      return;
    }
    if (!file || !concepto || !this.canUpload) {
      this.form.markAllAsTouched();
      return;
    }
    this.isUploading = true;
    this.resultado = null;
    this.terceroService.uploadTxt(file, qnaProceso, concepto, importeDefault)
      .pipe(
        finalize(() => {
          this.isUploading = false;
          this.cd.detectChanges();
        })
      )
      .subscribe({
        next: (res) => {
          if (!res.success) {
            this.toastService.error('Operación invalida', res.message ?? 'No fue posible cargar el archivo.', 6000);
            return;
          }
          this.resultado = res.data;
          // these two enable "Revalidar" and the validation summary
          this.totalRecordsCount = res.data.total;
          this.validRecordCount = res.data.aceptados;
          this.pageIndex = 0;
          this.clearFile();
          this.loadTerceroList(qnaProceso, concepto);
        },
        error: (err: HttpErrorResponse) => {
          this.toastService.error('Operación invalida', this.extractErrorMessage(err), 6000);
        }
      });
  }

  // ---------- revalidate (POST /terceros/validar) ----------
  onRevalidateLote(): void {
    if (this.totalRecordsCount === 0) {
      this.toastService.warning('Sin registros', 'No hay registros cargados para validar.');
      return;
    }
    const concepto = this.form.controls.concepto.value;
    const qnaProceso = this.qnaCompleta;
    if (!qnaProceso || !concepto) {
      this.toastService.error('Datos incompletos', 'No se pudo determinar la quincena o el concepto.');
      return;
    }

    this.isValidatingLote = true;
    this.terceroService.validateLote({ qnaProceso, concepto })
      .pipe(
        finalize(() => {
          this.isValidatingLote = false;
          this.cd.detectChanges();
        })
      )
      .subscribe({
        next: (response) => {
          if (!response.success) {
            this.toastService.error('Error al validar', response.message ?? 'No se pudo validar el lote.');
            return;
          }
          const data = response.data;
          this.resultado = data; // keeps the result panel in sync with the revalidation
          this.totalRecordsCount = data.total;
          this.validRecordCount = data.aceptados;
          const summary = `${data.aceptados} aceptados, ${data.rechazados} rechazados de ${data.total} registros.`;
          if (data.todosAceptados) {
            this.toastService.success('Validación completada', summary);
          } else {
            this.toastService.warning('Validación con observaciones', summary);
          }
          this.loadTerceroList(qnaProceso, concepto);
        },
        error: (error: HttpErrorResponse) => {
          this.toastService.error('Error al validar', error?.error?.message ?? 'No se pudo validar el lote.');
        }
      });
  }

  // ---------- list (GET /terceros/personalizar) ----------
  loadTerceroList(qnaProceso: number, concepto: string): void {
    this.terceroService.getListValidate({
        qnaProceso,
        concepto,
        busqueda: this.searchForm.controls.searchText.value,
        page: this.pageIndex,
        size: this.pageSize,
      })
      .subscribe({
        next: (response) => {
          if (!response.success) {
            this.toastService.error('Error al listar', response.message ?? 'No se pudo obtener la lista de registros.');
            return;
          }
          this.dataSource.data = response.data.content;
          this.totalElements = response.data.totalElements;
          this.cd.detectChanges();
        },
        error: (error: HttpErrorResponse) => {
          this.toastService.error('Error al listar', error?.error?.message ?? 'No se pudo obtener la lista de registros.');
        }
      });
  }

  // delete
  onDeleteRow(row: TerceroRow): void {
    const dialogRef = this.dialog.open(ConfirmDialog, {
      width: '420px',
      maxWidth: '95vw',
      data: {
        title: 'Eliminar registro',
        message: `¿Eliminar el registro de ${row.nombreTrabajador ?? row.rfc}?`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        type: 'danger',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      // the X button and the backdrop close with undefined: only an explicit true continues
      if (confirmed !== true) {
        return;
      }

      this.terceroService.deleteRecord(row.id).subscribe({
        next: (response) => {
          if (!response.success) {
            this.toastService.error('Error al eliminar', response.message ?? 'No se pudo eliminar el registro.');
            return;
          }
          this.toastService.success('Operación exitosa', 'El registro se eliminó correctamente.');

          // keep the summary in sync without another request
          this.totalRecordsCount--;
          if (row.estatus === 'ACEPTADO') {
            this.validRecordCount--;
          }

          // if it was the last row of the page, go back one page
          if (this.dataSource.data.length === 1 && this.pageIndex > 0) {
            this.pageIndex--;
          }

          const concepto = this.form.controls.concepto.value;
          const qnaProceso = this.qnaCompleta;
          if (qnaProceso && concepto) {
            this.loadTerceroList(qnaProceso, concepto);
          }
        },
        error: (error: HttpErrorResponse) => {
          this.toastService.error('Error al eliminar', error?.error?.message ?? 'No se pudo eliminar el registro.');
        },
      });
    });
  }

  //update
  onEditRow(row: TerceroRow): void {
    this.editingRowId = row.id;
  }

  onRecordUpdate(row: TerceroRow, rawValue: string): void {
    if (this.editingRowId !== row.id) {
      return;
    }
    this.editingRowId = null;
    const newImporte = Number(rawValue);
    if (rawValue.trim() === '' || Number.isNaN(newImporte) || newImporte <= 0) {
      this.toastService.warning('Importe inválido', 'El importe debe ser mayor a 0.');
      return;
    }
    if (newImporte === row.importeMensual) {
      return; 
    }
    const concepto = this.form.controls.concepto.value;
    const qnaProceso = this.qnaCompleta;
    if (!qnaProceso || !concepto) {
      this.toastService.error('Datos incompletos', 'No se pudo determinar la quincena o el concepto.');
      return;
    }
    this.terceroService.updateRecord(row.id, {
      rfc: row.rfc,
      nombreTrabajador: row.nombreTrabajador,
      numeroDocumento: row.numeroDocumento,
      tipoMovimiento: row.tipoMovimiento,
      importeMensual: newImporte,
      desde: row.desde,
    }).subscribe({
      next: (response) => {
        if (!response.success) {
          this.toastService.error('Error al actualizar', response.message ?? 'No se pudo actualizar el registro.');
          return;
        }
        this.toastService.success('Registro actualizado', 'El registro se actualizó y el lote se revalidó.');
        this.loadTerceroList(qnaProceso, concepto);
        forkJoin({
          all: this.terceroService.getListValidate({ qnaProceso, concepto, page: 0, size: 1 }),
          accepted: this.terceroService.getListValidate({ qnaProceso, concepto, estatus: 'ACEPTADO', page: 0, size: 1 }),
        }).subscribe({
          next: ({ all, accepted }) => {
            this.totalRecordsCount = all.data?.totalElements ?? 0;
            this.validRecordCount = accepted.data?.totalElements ?? 0;
            this.cd.detectChanges();
          },
          error: () => {
            this.toastService.error('Error', 'No se pudo actualizar el resumen de validación.');
          },
        });
      },
      error: (error: HttpErrorResponse) => {
        this.toastService.error('Error al actualizar', error?.error?.message ?? 'No se pudo actualizar el registro.');
      },
    });
  }

  onProcessPayroll(): void {
    if (this.totalRecordsCount === 0) {
      this.toastService.warning('Sin registros', 'Primero carga y valida un archivo TXT.');
      return;
    }
    const rechazados = this.totalRecordsCount - this.validRecordCount;
    if (rechazados > 0) {
      this.toastService.warning('Registros rechazados', `Hay ${rechazados} registro(s) rechazado(s). Corrígelos antes de procesar.`);
      return;
    }
    const concepto = this.form.controls.concepto.value;
    const qnaProceso = this.qnaCompleta;
    if (!qnaProceso || !concepto) {
      this.toastService.error('Datos incompletos', 'No se pudo determinar la quincena o el concepto.');
      return;
    }
    this.isProcessingPayroll = true;
    this.toastService.upsertPersistent(this.PROCESS_TOAST_ID, 'info', 'Procesando movimientos', `Aplicando ${this.totalRecordsCount} registros...`);
    this.terceroService.processLote({ qnaProceso, concepto })
      .pipe(
        finalize(() => {
          this.isProcessingPayroll = false;
          this.cd.detectChanges();
        })
      )
      .subscribe({
        next: (response) => {
          if (!response.success) {
            this.toastService.resolvePersistent(this.PROCESS_TOAST_ID, 'error', 'No se pudo procesar', response.message ?? 'No hay registros aceptados para continuar.');
            return;
          }
          const data = response.data;
          this.toastService.resolvePersistent(this.PROCESS_TOAST_ID, 'success', 'Procesado con éxito', `${data.total} movimientos se aplicaron correctamente.`);
          this.resultado = null;
          this.totalRecordsCount = 0;
          this.validRecordCount = 0;
          this.totalElements = 0;
          this.pageIndex = 0;
          this.dataSource.data = [];
          this.searchForm.controls.searchText.setValue('', { emitEvent: false });
        },
        error: (error: HttpErrorResponse) => {
          this.toastService.resolvePersistent(this.PROCESS_TOAST_ID, 'error', 'Error al procesar', error?.error?.message ?? 'Ocurrió un error al procesar los movimientos.');
        },
      });
  }

  loadLotes(): void {
    this.terceroService.getLotes().subscribe({
      next: (response) => {
        if (!response.success) {
          this.toastService.error('Error', response.message ?? 'No se pudieron obtener los lotes.');
          return;
        }
        const lotes = response.data ?? [];
        if (lotes.length === 0) {
          this.toastService.warning('Sin lotes', 'No hay lotes pendientes de procesar.');
          return;
        }
        this.dialog.open(ConsultaTercerosLotesDialog, {
          width: '1000px',
          maxWidth: '95vw',
          data: {
            lotes,
            calendarioActual: this.calendarioActual,
          },
        });
      },
      error: (error: HttpErrorResponse) => {
        this.toastService.error('Error', error?.error?.message ?? 'No se pudieron obtener los lotes.');
      },
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    const concepto = this.form.controls.concepto.value;
    const qnaProceso = this.qnaCompleta;
    if (qnaProceso && concepto) {
      this.loadTerceroList(qnaProceso, concepto);
    }
  }

  // the search goes to the backend (`busqueda`) so it covers the whole batch, not only the current page
  private setupSearch(): void {
    this.searchForm.controls.searchText.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const concepto = this.form.controls.concepto.value;
        const qnaProceso = this.qnaCompleta;
        if (!qnaProceso || !concepto || this.totalRecordsCount === 0) {
          return;
        }
        this.pageIndex = 0;
        this.loadTerceroList(qnaProceso, concepto);
      });
  }

  // ---------- helpers ----------
  private clearFile(): void {
    this.selectedFile = null;
    this.resetFileInput();
  }

  private rejectFile(message: string): void {
    this.clearFile();
    this.toastService.error('Operación invalida', message, 6000);
  }

  private resetFileInput(): void {
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  private extractErrorMessage(err: HttpErrorResponse): string {
    const body: unknown = err.error;
    if (typeof body === 'object' && body !== null && 'message' in body) {
      const message = (body as { message: unknown }).message;
      if (typeof message === 'string' && message.trim()) return message;
    }
    return 'No fue posible cargar el archivo.';
  }

  private aplicarFiltro(tipo: number): void {
    this.conceptosFiltrados = tipo === TIPO_INSTITUCIONAL ? this.conceptosInstitucionales : this.conceptosNoInstitucionales;
    this.form.controls.concepto.reset(null);
    this.cd.detectChanges();
  }

  private ordenarPorPrioridad(conceptos: TerceroConcepto[], codigosPrioridad: string[]): TerceroConcepto[] {
    const rank = new Map<string, number>();
    codigosPrioridad.forEach((c, i) => rank.set(c.toLowerCase(), i));
    return [...conceptos].sort((a, b) => {
      const ca = (a?.cve ?? '').toString().toLowerCase();
      const cb = (b?.cve ?? '').toString().toLowerCase();
      const ra = rank.has(ca) ? rank.get(ca)! : Number.POSITIVE_INFINITY;
      const rb = rank.has(cb) ? rank.get(cb)! : Number.POSITIVE_INFINITY;
      if (ra !== rb) return ra - rb;
      return ca.localeCompare(cb);
    });
  }

  private dedupeByCve(conceptos: TerceroConcepto[]): TerceroConcepto[] {
    const map = new Map<string, TerceroConcepto>();
    for (const c of conceptos ?? []) {
      const key = (c?.cve ?? '').toString().toLowerCase().trim();
      if (!key) continue;
      if (!map.has(key)) map.set(key, c);
    }
    return Array.from(map.values());
  }

}
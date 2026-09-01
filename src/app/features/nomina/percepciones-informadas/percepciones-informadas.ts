import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, inject, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ToastService } from '../../../core/services/toast.service';
import { Calendario } from '../../../core/model/calendario.model';
import { CalendarioService } from '../../../core/services/calendario.service';
import { MatOption, MatSelectModule } from '@angular/material/select';
import { MatAutocomplete, MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { EmpleadoItem } from '../../../core/model/emplado.model';
import { formatEmployeeDisplay } from '../../../shared/helpers/empelado.helper';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { ExcelUploadService, PERCEPCIONES_REQUIRED_COLUMNS } from '../../../core/services/excel-upload.service';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { PercepcionesInformadasService } from '../../../core/services/percepciones-informadas.service';
import { PersonalizarRow } from '../../../core/model/personzaliza-row.model';

@Component({
  selector: 'app-percepciones-informadas',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatCardModule,
    MatSelectModule,
    MatOption,
    MatAutocompleteModule,
    MatIconModule,
    MatInputModule,
    MatTableModule,
    MatPaginatorModule,
  ],
  templateUrl: './percepciones-informadas.html',
  styleUrl: './percepciones-informadas.css'
})
export class PercepcionesInformadas {

  cargandoQna = false;
  errorQna = false;
  calendarioActual: Calendario | null = null; 
  resultados: EmpleadoItem[] = [];
  empleadoId: number | null = null;
  empleadoRfc: string | null = null;
  totalElements = 0;
  validRecordCount = 0;
  totalRecordsCount = 0;
  selecteExcelFile: File | null = null;
  editingRowId: number | null = null;
  isProcessingPayroll = false;
  resultAvalible = false;
  processedRows: PersonalizarRow[] = [];
  selectedRowId: number | null = null;
  yaSeProceso = false;

  isValidatingLote = false;
  

  dataSource = new MatTableDataSource<PersonalizarRow>([]);

  readonly displayedColumns: string[] = ['rfc', 'curp', 'nombreTrabajador', 'cantidad', 'importe', 'estatus', 'acciones'];


  private readonly toastService = inject(ToastService);
  private readonly calendarioService = inject(CalendarioService);
  private readonly excelUploadService = inject(ExcelUploadService);
  private readonly percepcionesInformadasService = inject(PercepcionesInformadasService)
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly fb = inject(FormBuilder);
  
  private readonly VALIDATION_TOAST_ID = 5001;
  private readonly PROCESAMIENTO_TOAST_ID = 5002;
  readonly requiredColumns = PERCEPCIONES_REQUIRED_COLUMNS;

  @ViewChild(MatAutocompleteTrigger) autocompleteTrigger?: MatAutocomplete;
  @ViewChild('fileInput') fileInputRef?: ElementRef<HTMLInputElement>;

  get validationSummaryText(): string {
    const rechazados = this.totalRecordsCount - this.validRecordCount;
    return `Aceptados: ${this.validRecordCount} · Rechazados: ${rechazados} de ${this.totalRecordsCount} registros`;
  }

  ngOnInit():void  {
    this.loadQnaActivated();
    //this.loadMockData();
    this.tableFilter();
  }

  readonly searchForm = this.fb.group({
    searchText: [''],
    concepto: [''],

  })

  loadQnaActivated():void {
    this.cargandoQna = true;
    this.errorQna = false;
    this.calendarioService.getQnaActiva().subscribe({
      next: (resp) => {
        const calendario = resp?.data ?? null;
        this.calendarioActual = calendario;
        this.cargandoQna = false;
        this.errorQna = !calendario;
        this.cdr.detectChanges();
      },
      error: () => {
        this.calendarioActual = null;
        this.cargandoQna = false;
        this.errorQna = true;
        this.cdr.detectChanges();
      }
    });
  }

  async onExcelSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0) ?? null;
    if (!file) {
      return;
    }
    const conceptSeleted = this.searchForm.get('concepto')?.value;
    if(!conceptSeleted) {
      this.toastService.warning('Concepto requerido', 'Selecciona un concepto antes de cargar el archivo.');
      input.value = '';
      return;
    }
    const validationError = this.excelUploadService.validate(file);
    if (validationError) {
      this.toastService.error('Archivo inválido', validationError);
      this.selecteExcelFile = null;
      input.value = '';
      return;
    }
    const columnsError = await this.excelUploadService.validateRequiredColumns(file);
    if (columnsError) {
      this.toastService.error('Estructura inválida', columnsError);
      this.selecteExcelFile = null;
      input.value = '';
      return;
    }
    this.selecteExcelFile = file;
    this.toastService.success('Archivo seleccionado', `"${file.name}" se seleccionó correctamente.`);
  }

  async onAceptBotton(): Promise<void> {
    if (!this.selecteExcelFile) {
      this.toastService.warning('Sin archivo', 'Primero se debe de cargar un archivo Excel valido.');
      return;
    }
    const concepto = this.searchForm.get('concepto')?.value;
    const qnaProceso = this.calendarioActual?.qna;
    if (!qnaProceso) {
      this.toastService.error('Quincena no disponible', 'No se pudo determinar la quincena activa.');
      return;
    }
    if (!concepto) {
      this.toastService.warning('Concepto requerido', 'Selecciona un concepto antes de cargar el archivo.');
      return;
    }
    this.toastService.upsertPersistent(this.VALIDATION_TOAST_ID, 'info', 'Validando registros', 'Procesando la información del archivo, esto puede tardar unos segundos...');
    this.percepcionesInformadasService.cargarExcel(this.selecteExcelFile, qnaProceso, concepto)
      .subscribe({
        next: (response) => {
          if (!response.success) {
            this.toastService.resolvePersistent(this.VALIDATION_TOAST_ID,'error', 'Error al cargar archivo', response.message ?? 'No se pudo procesar el archivo.',);
            return;
          }
          const data = response.data;
          const hayObservaciones = data.erroresFormato.length > 0 || data.rechazados > 0;
          this.toastService.resolvePersistent(
            this.VALIDATION_TOAST_ID,
            hayObservaciones ? 'warning' : 'success',
            hayObservaciones ? 'Carga con observaciones' : 'Registros cargados',
            `${data.aceptados} aceptados, ${data.rechazados} rechazados de ${data.insertados} insertados (${data.omitidos} omitidos por formato).`,
          );

          if (data.erroresFormato.length > 0) {
            const detalle = data.erroresFormato
              .slice(0, 5)
              .map((e) => `Fila ${e.fila}: ${e.motivo}`)
              .join(' | ');
            this.toastService.warning('Filas con error de formato', detalle);
          }
          this.cargarListaPersonalizar(qnaProceso, concepto);
        },
        error: (error) => {
          this.toastService.resolvePersistent(this.VALIDATION_TOAST_ID, 'error', 'Error al cargar archivo', error?.error?.message ?? 'Ocurrió un error al procesar el archivo.');
        },
      });
  }

  private cargarListaPersonalizar(qnaProceso: number, concepto: string): void {
    this.percepcionesInformadasService.listarPersonalizar(qnaProceso, concepto).subscribe({
      next: (response) => {
        const data = response.data;
        this.dataSource.data = data.content;
        this.totalRecordsCount = data.totalElements;
        this.totalElements = data.totalElements;
        this.validRecordCount = data.content.filter((row) => row.estatus === 'ACEPTADO').length;
      },
      error: (error) => {
        this.toastService.error('Error al listar', error?.error?.message ?? 'No se pudo obtener la lista de registros.');
      },
    });
  }

  onRevalidarLote(): void {
    const ids = this.dataSource.data.map((row) => row.id);
    if (ids.length === 0) {
      this.toastService.warning('Sin registros', 'No hay registros cargados para validar.');
      return;
    }
    const concepto = this.searchForm.get('concepto')?.value;
    const qnaProceso = this.calendarioActual?.qna;
    if (!qnaProceso || !concepto) {
      this.toastService.error('Datos incompletos', 'No se pudo determinar la quincena o el concepto.');
      return;
    }
    this.isValidatingLote = true;
    this.percepcionesInformadasService.validarRegistros(ids).subscribe({
      next: (response) => {
        const data = response.data;
        this.toastService.success('Validación completada', `${data.aceptados} aceptados, ${data.rechazados} rechazados de ${data.total} registros.`,);
        this.cargarListaPersonalizar(qnaProceso, concepto);
        this.isValidatingLote = false;
      },
      error: (error) => {
        this.toastService.error('Error al validar', error?.error?.message ?? 'No se pudo validar el lote.');
        this.isValidatingLote = false;
      },
    });
  }

  onOptionSelected(emp: EmpleadoItem):void {
    this.empleadoId = emp.id ?? null;
    this.selectEmployee(emp);
    this.searchForm.get('searchText')?.setValue(formatEmployeeDisplay(emp));
  }

  onRowSelected(row: PersonalizarRow): void {
    this.selectedRowId = row.id;
  }

  onPersonalitedQuantity(row: PersonalizarRow): void {
      if (!row) {
        this.toastService.error('Operacion invalida', 'Seleccionar un registro para hacer la edición')
          return;
      }
      this.selectedRowId = row.id;
      this.editingRowId = row.id;
  }

  onQuantityChange(row: PersonalizarRow, rawValue: string): void {
    const newValue = Number(rawValue);
    if (Number.isNaN(newValue)) {
      this.editingRowId = null;
      this.selectedRowId = null;
      return;
    }

    this.percepcionesInformadasService
      .personalizarRegistro(row.id, row.rfc, row.curp, row.nombreTrabajador, row.importe, newValue)
      .subscribe({
        next: (response) => {
          const data = response.data;

          // WHY actualizar CON el estatus/motivoRechazo que el
          // backend acaba de calcular (no solo la cantidad local):
          // esta es la confirmación real de que el registro cambió de
          // estado tras la edición — reflejarlo en la tabla evita que
          // el usuario piense que su registro sigue "pendiente" cuando
          // en realidad ya fue rechazado por el backend.
          this.dataSource.data = this.dataSource.data.map((item) =>
            item.id === row.id
              ? { ...item, cantidad: newValue, estatus: data.estatus, motivoRechazo: data.motivoRechazo }
              : item,
          );

          if (data.estatus === 'RECHAZADO') {
            this.toastService.warning('Registro rechazado', data.motivoRechazo ?? 'El registro no pasó la validación.');
          } else {
            this.toastService.success('Registro actualizado', 'La cantidad se actualizó correctamente.');
          }
        },
        error: (error) => {
          this.toastService.error(
            'Error al actualizar',
            error?.error?.message ?? 'No se pudo actualizar el registro.',
          );
        },
      });

    this.editingRowId = null;
    this.selectedRowId = null;
  }

  async onProcessPayroll(): Promise<void> {
    if (this.totalRecordsCount === 0) {
      this.toastService.warning('Sin registros', 'Primero carga y valida un archivo Excel.');
      return;
    }
    const rechazados = this.dataSource.data.filter((row) => row.estatus === 'RECHAZADO').length;
    if (rechazados > 0) {
      this.toastService.warning('Registros rechazados', `Hay ${rechazados} registro(s) rechazado(s). Corrígelos antes de procesar.`);
      return;
    }
    const concepto = this.searchForm.get('concepto')?.value;
    const qnaProceso = this.calendarioActual?.qna;
    if (!qnaProceso || !concepto) {
      this.toastService.error('Datos incompletos', 'No se pudo determinar la quincena o el concepto.');
      return;
    }
    this.isProcessingPayroll = true;
    this.toastService.upsertPersistent(this.PROCESAMIENTO_TOAST_ID, 'info', 'Procesando a nómina', `Enviando ${this.totalRecordsCount} registros al módulo de nómina...`);

    this.percepcionesInformadasService.continuar(qnaProceso, concepto).subscribe({
      next: (response) => {
        if (!response.success) {
          this.toastService.resolvePersistent(this.PROCESAMIENTO_TOAST_ID, 'error', 'No se pudo procesar', response.message ?? 'No hay registros aceptados para continuar.',);
          this.isProcessingPayroll = false;
          return;
        }

        const data = response.data;
        this.toastService.resolvePersistent(this.PROCESAMIENTO_TOAST_ID, 'success', 'Procesado con éxito', `${data.insertadosHistorico} de ${data.total} registros se enviaron correctamente a nómina.`,);
        this.processedRows = [...this.dataSource.data];
        this.resultAvalible = true;
        this.yaSeProceso = true;
        this.isProcessingPayroll = false;
      },
      error: (error) => {
        this.toastService.resolvePersistent(this.PROCESAMIENTO_TOAST_ID, 'error', 'Error al procesar', error?.error?.message ?? 'Ocurrió un error al procesar el volcado a nómina.');
        this.isProcessingPayroll = false;
      },
    });
  }

  onDownloadResult(): void {
    const concepto = this.searchForm.get('concepto')?.value;
    const qnaProceso = this.calendarioActual?.qna;

    if (!qnaProceso) {
      this.toastService.error('Quincena no disponible', 'No se pudo determinar la quincena activa.');
      return;
    }

    this.percepcionesInformadasService.descargarValidaciones(qnaProceso, concepto ?? undefined).subscribe({
      next: (blob) => {
        const fecha = new Date().toISOString().slice(0, 10);
        const fileName = `validaciones_qna${qnaProceso}_${fecha}.xlsx`;

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        window.URL.revokeObjectURL(url);

        this.toastService.success('Descarga completada', 'El archivo de resultado se descargó correctamente');
        this.resultAvalible = false;
        this.processedRows = [];
        this.clear();
      },
      error: (error) => {
        // WHY parsear el Blob de error manualmente: con
        // responseType:'blob', HttpClient entrega TAMBIÉN el body del
        // error como Blob (no JSON parseado) — sin esto, mostraríamos
        // un mensaje genérico en vez del mensaje real que el backend
        // ahora sí manda (ej. "No hay validaciones procesadas...").
        if (error.error instanceof Blob) {
          error.error.text().then((text: string) => {
            try {
              const parsed = JSON.parse(text);
              this.toastService.error('Sin resultados', parsed.message ?? 'No hay validaciones procesadas para descargar.');
            } catch {
              this.toastService.error('Error al descargar', 'No se pudo generar el archivo de resultado.');
            }
          });
        } else {
          this.toastService.error('Error al descargar', 'No se pudo generar el archivo de resultado.');
        }
      },
    });
  }

  selectEmployee(emp: EmpleadoItem):void {
    if(!emp) {
      this.empleadoId = null;
      return;
    }
    const rfc = (emp.rfc ?? emp.RFC ?? '').toString().trim();
    this.empleadoRfc = rfc || null;
  }

  tableFilter(): void {
    this.dataSource.filterPredicate = (row: PersonalizarRow, filter: string) => {
      const normalizedFilter = filter.trim().toLowerCase();
      return (
        row.rfc.toLowerCase().includes(normalizedFilter) ||
        row.curp.toLowerCase().includes(normalizedFilter) ||
        row.nombreTrabajador.toLowerCase().includes(normalizedFilter)
      );
    };
    this.searchForm.get('searchText')?.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((value) => {
        this.dataSource.filter = (value ?? '').trim().toLowerCase();
      });
  }

  clear():void {
    this.selecteExcelFile = null;
    this.editingRowId= null;
    this.dataSource.data = [];
    this.totalElements = 0;
    this.validRecordCount = 0;
    this.totalRecordsCount = 0;
    this.yaSeProceso = false;

    this.searchForm.reset({
      searchText: '',
    });
    this.resultados = [];
    this.empleadoId = null;
    this.empleadoRfc = null;
    if(this.fileInputRef) {
      this.fileInputRef.nativeElement.value = '';
    }
  }
}

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
import { Excel } from '../../../core/model/excel.model';
import { ExcelResult } from '../../../core/model/excel-result.model';
import { debounce, debounceTime, distinctUntilChanged } from 'rxjs';
import { ProcessProgress } from '../../../core/model/process-progress.model';

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

  form!: FormGroup;
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
  processedRows: ExcelResult[] = [];
  selectedRowId: number | null = null;
  yaSeProceso = false;

  dataSource = new MatTableDataSource<ExcelResult>([]);

  readonly displayedColumns: string[] = ['rfc', 'curp', 'concepto', 'cantidad', 'importe', 'estatus'];

  private readonly toastService = inject(ToastService);
  private readonly calendarioService = inject(CalendarioService);
  private readonly excelUploadService = inject(ExcelUploadService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly fb = inject(FormBuilder);
  
  private readonly VALIDATION_TOAST_ID = 5001;
  private readonly PROCESAMIENTO_TOAST_ID = 5002;
  readonly requiredColumns = PERCEPCIONES_REQUIRED_COLUMNS;

  @ViewChild(MatAutocompleteTrigger) autocompleteTrigger?: MatAutocomplete;
  @ViewChild('fileInput') fileInputRef?: ElementRef<HTMLInputElement>;

  get validationSummaryText(): string {
    return `Registros validados: ${this.validRecordCount} - ${this.totalRecordsCount}`;
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

    this.toastService.upsertPersistent(
      this.VALIDATION_TOAST_ID,
      'info',
      'Validando registros',
      'Procesando la información del archivo, esto puede tardar unos segundos...',
    );

    try {
      const parsedRows = await this.excelUploadService.parseRows(this.selecteExcelFile);
      this.loadMockValidation(parsedRows);

      this.toastService.resolvePersistent(
        this.VALIDATION_TOAST_ID,
        'success',
        'Registros cargados',
        `Se cargaron ${this.totalRecordsCount} registros del archivo.`,
      );
    } catch (error) {
      this.toastService.resolvePersistent(
        this.VALIDATION_TOAST_ID,
        'error',
        'Error al procesar',
        (error as Error).message,
      );
    }
  }

  onOptionSelected(emp: EmpleadoItem):void {
    this.empleadoId = emp.id ?? null;
    this.selectEmployee(emp);
    this.form.get('searchText')?.setValue(formatEmployeeDisplay(emp));
  }

  onRowSelected(row: ExcelResult):void {
    this.selectedRowId = row.id;
  }

  onPersonalitedQuantity():void {
    if(!this.selectedRowId) {
      this.toastService.warning('Sin selección', 'Seleccionar un registro de la tabla antes de personalizar la cantidad.');
      return;
    }
    this.editingRowId = this.selectedRowId;
  }

  onQuantityChange(row: ExcelResult, rawValue: string):void {
    const newValue = Number(rawValue);
    if(!Number.isNaN(newValue)) {
      this.dataSource.data = this.dataSource.data.map((item) => 
        item.id === row.id ? { ...item, cantidad: newValue} : item,
      );
    }
    this.editingRowId = null;
    this.selectedRowId = null;
  }

  async onProcessPayroll(): Promise<void> {
    if (this.totalRecordsCount === 0) {
      this.toastService.warning('Sin registros', 'Primero carga y valida un archivo Excel.');
      return;
    }
    if (this.validRecordCount < this.totalRecordsCount) {
      this.toastService.warning('Registros con observaciones', `Hay ${this.totalRecordsCount - this.validRecordCount} registro(s) inválido(s). Corrígelos antes de procesar.`);
      return;
    }

    this.isProcessingPayroll = true;

    try {
      await this.procesarNominaConProgresoMock(
        this.totalRecordsCount,
        (progress) => this.onProgressActually(progress),
      );
      this.toastService.resolvePersistent(this.PROCESAMIENTO_TOAST_ID, 'success','Procesado con éxito', `${this.totalRecordsCount} registros se enviaron correctamente a nómina.`, );
      this.processedRows = [...this.dataSource.data];
      this.resultAvalible = true;
      this.yaSeProceso = true;
    } catch (error) {
      this.toastService.resolvePersistent(this.PROCESAMIENTO_TOAST_ID, 'error', 'Error al procesar', (error as Error).message,);
    
    } finally {
      this.isProcessingPayroll = false;
    }
  }

  onProgressActually(progress: ProcessProgress):void {
    this.toastService.upsertPersistent(this.PROCESAMIENTO_TOAST_ID, 'info', 'Procesando a nómina',  `Volcando registros: ${progress.process} de ${progress.total}...`);
  }

  onDownloadResult() {
    const fecha = new Date().toISOString().slice(0, 10);
    const fileName = `validación_percepciones_${fecha}.xlsx`;
    this.excelUploadService.exportResultados(this.processedRows, fileName);

    this.toastService.success('Descarga completada', 'El archivo de resultado se descargó correctamente');
    this.resultAvalible = false;
    this.processedRows =[];
    this.clear();
  }

  selectEmployee(emp: EmpleadoItem):void {
    if(!emp) {
      this.empleadoId = null;
      return;
    }
    const rfc = (emp.rfc ?? emp.RFC ?? '').toString().trim();
    this.empleadoRfc = rfc || null;
  }

  tableFilter():void {
    this.dataSource.filterPredicate = (row: ExcelResult, filter: string) => {
      const normalizedFilter = filter.trim().toLowerCase();
      return (
        row.rfc.toLowerCase().includes(normalizedFilter)||
        row.curp.toLowerCase().includes(normalizedFilter)||
        row.concepto.toLowerCase().includes(normalizedFilter)
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
  
  private loadMockValidation(parsedRows: Excel[]): void {
    const mockValidatedRows: ExcelResult[] = parsedRows.map((row, index) => ({
      ...row, // curp, rfc, cantidad, concepto, importe ya vienen del Excel
      id: index + 1,
      estatus: row.curp && row.rfc ? 'APLICADO' : 'CANCELADO',
      mostrarEmpleado: true,
    }));

    this.totalRecordsCount = mockValidatedRows.length;
    this.validRecordCount = mockValidatedRows.filter((row) => row.estatus === 'APLICADO').length;
    this.dataSource.data = mockValidatedRows;
    this.totalElements = mockValidatedRows.length;
  }

  private procesarNominaConProgresoMock(
    total: number,
    onProgress: (progress: ProcessProgress) => void,
  ): Promise<void> {
    const BATCH_SIZE = Math.max(1, Math.ceil(total / 10));
    const DELAY_PER_BATCH_MS = 150;

    return new Promise((resolve) => {
      let processed = 0;

      const processBatch = () => {
        processed = Math.min(processed + BATCH_SIZE, total);
        const completado = processed >= total;

        onProgress({ process: processed, total, completed: completado});

        if (completado) {
          resolve();
          return;
        }

        setTimeout(processBatch, DELAY_PER_BATCH_MS);
      };

      processBatch();
    });
  }
}

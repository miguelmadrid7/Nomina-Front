import { CommonModule } from '@angular/common';
import { Component, ViewChild, NgZone, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { TerceroService } from '../../../core/services/tercero.service';
import { NominaRow } from '../../../models/nomina-Row.model';
import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BeneficiarioJMRequest } from '../../../models/beneficiario-jm-request.model';
import { MatInputModule } from '@angular/material/input';
import { MatDialog } from '@angular/material/dialog';
import { ApiResponse } from '../../../models/api-Response.model';
import { TercerosDialog } from '../../../shared/dialogs/terceros-dialog/terceros-dialog';
import { PensionAlimenDialog } from '../../../features/nomina/pension-alimen-dialog/pension-alimen-dialog';
import { LoaderService } from '../../../core/services/loader.service';
import { finalize } from 'rxjs';
import { Empleado } from '../../servicios/empleado';
import { EmpleadoItem } from '../../../models/emplado.model';

@Component({
  selector: 'app-terceros',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTableModule,
    MatIconModule,
    MatPaginatorModule,
    MatAutocompleteModule,
    MatInputModule,
  ],
  templateUrl: './terceros.html',
  styleUrl: './terceros.css'
})
export class Terceros {

  private filtersReady = true;
  private isRefreshing = false;
  private lastQnaKey: string | null = null;
  private qnaDebounceId: any;


  @ViewChild(MatAutocompleteTrigger) autocompleteTrigger?: MatAutocompleteTrigger;
  @ViewChild(MatPaginator) paginator?: MatPaginator;

  dataSource = new MatTableDataSource<NominaRow>([]);
  filterValues: any = { search: '', estatus: '' };
  displayedColumns: string[] = [ 'rfc', 'curp', 'nombreCompleto', 'tipoOrden', 'estatus', 'acciones'];
  tipoOrdenOptions = [ { label: 'Alta' }, { label: 'Baja' }, { label: 'Cambio' } ];
  estatusOptions = [ { label: 'Registrado' }, { label: 'Pendiente' }, { label: 'Aprobado' } ];


  form!: FormGroup;
  detailForm!: FormGroup;
  anio: number[] = [2026, 2025, 2024];
  quincena: number[] = Array.from({ length: 24 }, (_, i) => i + 1);
  concepto: any[] = [];
  beneficiarios: any[] = [];
  totalElements = 0;
  showRecords = true;
  anioSeleccionado: number | null = null;
  quincenaSeleccionada: number | null = null;
  selectedRow: any;


  resultado: EmpleadoItem[] = [];

  cargandoBusqueda = false;
  showFilters = true;

  search: string = '';
  qnaProceso!: number;


  
  constructor(
    private fb: FormBuilder, 
    private snackBar: MatSnackBar,
    private zone: NgZone,
    private cd: ChangeDetectorRef,
    private dialog: MatDialog,
    private terceroService: TerceroService,
    private loaderService: LoaderService,
  ) {}


  ngOnInit() {
    this.form = this.fb.group({ 
      anio: [null],
      quincena: [null],
      concepto: [null],
      tipoOrden: [null],
      estatus: [null],

      busqueda: this.fb.group({
        empleadoId: [null],
        searchText: ['']
      }),

      empleado: this.fb.group({
        rfc: [''],
        curp: [''],
        primerApellido: [''],
        segundoApellido: [''],
        nombre: ['']
      })
    });
    this.detailForm = this.fb.group({
        rfc: [''],
        nombreCompleto: [''],
        qnaProceso: ['']
    });
    this.cargarConceptos();
    this.dataSource.filterPredicate = (data: any, filter: string) => {
    const filters = JSON.parse(filter);

    const matchSearch =
      !filters.search ||
      (data.curp ?? '').toUpperCase().includes(filters.search) ||
      (data.rfc ?? '').toUpperCase().includes(filters.search) ||
      (data.nombreEmpleado ?? '').toUpperCase().includes(filters.search);

    const matchEstatus =
      !filters.estatus || data.estatus === filters.estatus;

    return matchSearch && matchEstatus;
    };
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.paginator) {
        this.dataSource.paginator = this.paginator;
      }
    }, 0);
  }

  filterEstatus(value: string) {
  this.filterValues.estatus = value;
  this.dataSource.filter = JSON.stringify(this.filterValues);
  }


  private showSnack(message: string, action: string, duration: number): void {
    this.zone.runOutsideAngular(() => {
      setTimeout(() => {
        this.zone.run(() => this.snackBar.open(message, action, { duration }));
      }, 50);
    });
  }

  //  Busqueda del empleado
  buscarEmpleado() {
    const value = this.form.get('busqueda.searchText')?.value;
    if (value && typeof value === 'object') return;

    const texto = typeof value === 'string' ? value.trim() : '';
    if (!texto) {
      this.resultado = [];
      this.autocompleteTrigger?.closePanel();
      this.showSnack('Captura un criterio de busqueda', 'Cerrar', 4000);
      return;
    }
    if (texto.length < 3) {
      this.resultado = [];
      this.autocompleteTrigger?.closePanel();
      this.showSnack('Captura almenos 3 caractares para buscar', 'Cerrar', 4000);
      return;
    }

    this.cargandoBusqueda = true;
    this.terceroService.searchEmployees(texto).subscribe({
      next: (lista: EmpleadoItem[]) => {
        this.resultado = (lista ?? []).filter(e => {
          const rfc = (e.rfc ?? e.RFC ?? '').trim();
          const curp = (e.curp ?? e.CURP ?? '').trim();
          const pa = (e.primerApellido ?? e.primer_apellido ?? '').trim();
          const sa = (e.segundoApellido ?? e.segundo_apellido ?? '').trim();
          const nombre = (e.nombre ?? '').trim();
          const empleadoStr = (e.empleado ?? '').trim();
          const nombreCompleto = (e.nombreCompleto ?? '').trim();

          return !!(rfc || curp || pa || sa || nombre || empleadoStr || nombreCompleto);
        });

        this.cargandoBusqueda = false;
          if (this.resultado.length > 0) {
            setTimeout(() => this.autocompleteTrigger?.openPanel());
          } else {
            this.autocompleteTrigger?.closePanel();
          }
      },
      error: () => {
        this.cargandoBusqueda = false;
        this.showSnack('Error en la busqueda', 'Cerrar', 4000);
      }
    });
  }

  //  Seleccion de empleado
  empleadoSeleccionado(emp: EmpleadoItem): void {
    let rfc = (emp.rfc ?? emp.RFC ?? '').trim();
    let curp = (emp.curp ?? emp.CURP ?? '').trim();
    let nombre = (emp.nombreCompleto ?? '').trim();

      if (!nombre) {
        const fullName = [
          emp.primerApellido ?? emp.primer_apellido ?? '',
          emp.segundoApellido ?? emp.segundo_apellido ?? '',
          emp.nombre ?? ''
        ].map(x => x.trim()).filter(Boolean).join(' ');
        nombre = fullName.trim();
      }

    const empleadoStr = (emp.empleado ?? '').trim();
      if (empleadoStr) {
        const parts = empleadoStr.split(' - ').map(p => p.trim());
        if (!rfc && parts.length >= 1) rfc = parts[0] ?? '';
        if (!curp && parts.length >= 2) curp = parts[1] ?? '';
        if (!nombre && parts.length >= 3) nombre = parts.slice(2).join(' - ').trim();
      }

    const row: any = {
      rfc,
      curp,
      nombreEmpleado: nombre
    };

    this.dataSource.data = [row];
    this.totalElements = 1;

    this.resultado = [];
    this.autocompleteTrigger?.closePanel();
    this.cargarNominaTercero();
  }

  //  Muestra lista de empleados
  displayEmpleado(emp: EmpleadoItem | string | null): string {
    if (!emp) return '';
    if (typeof emp === 'string') return emp;

    const rfc = (emp.rfc ?? emp.RFC ?? '').trim();

    const fullName = [
      emp.primerApellido ?? emp.primer_apellido ?? '',
      emp.segundoApellido ?? emp.segundo_apellido ?? '',
      emp.nombre ?? ''
    ].map(x => x.trim()).filter(Boolean).join(' ');

    const etiqueta = (emp.nombreCompleto ?? '').trim() || fullName || (emp.empleado ?? '').trim();
    return [rfc, etiqueta].filter(Boolean).join(' - ');
  }

  onQnaChange(): void {
    this.anioSeleccionado = this.form.get('anio')?.value;
    this.quincenaSeleccionada = this.form.get('quincena')?.value;

    if (!this.showRecords || !this.filtersReady) return;

    clearTimeout(this.qnaDebounceId);

    this.qnaDebounceId = setTimeout(() => {
      if (this.anioSeleccionado && !this.quincenaSeleccionada) {
        this.loaderService.show();
        this.dataSource.data = [];
        this.totalElements = 0;

        setTimeout(() => this.loaderService.hide(), 4000);
        return;
      }

    const key = `${this.anioSeleccionado}-${this.quincenaSeleccionada}`;

      if (this.lastQnaKey !== key && !this.isRefreshing) {
        this.lastQnaKey = key;
        this.loadNomina();
      }
    }, 0);
  }
  
  getNomina(): void {
      if (this.isRefreshing) return;
        this.isRefreshing = true;
        this.loaderService.show();
  
        this.terceroService.getNominaChequ().pipe(
          finalize(() => {
            this.loaderService.hide();
            this.isRefreshing = false;
          })
        ).subscribe({
          next: (response) => {
            if (!response.success) {
              this.showSnack(response.message || 'Error', 'Cerrar', 4000);
              return;
            }
  
        const raw = response?.data ?? [];
        const mapped: NominaRow[] = raw.map((row: any[]) => ({
          noComprobante: row[0],
          ur: row[1],
          periodo: row[2],
          qnaProceso: (() => {
            const per = String(row[2] ?? '');
            const m = per.match(/^(\d{1,2})\/(\d{4})$/);
            if (m) {
              const q = m[1].padStart(2,'0');
              const y = m[2];
              return parseInt(`${y}${q}`, 10);
            }
            return null;
          })(),
            tipoNomina: row[3],
            clavePlaza: row[4],
            curp: row[5],
            rfc: row[6],
            nombreEmpleado: `${row[7]} ${row[8]} ${row[9]}`,
            tipoConcepto: row[10],
            concepto: row[11],
            descConcepto: row[12],
            importe: Number(row[13]) || 0,
            baseCalculoIsr: Number(row[14]) || 0
          })
        );
  
        const targetQna = parseInt(`${this.anioSeleccionado}${this.quincenaSeleccionada?.toString().padStart(2,'0')}`, 10);
        const filtered = mapped.filter(r => r.qnaProceso === targetQna);
  
        // Agrupar por empleado/comprobante para evitar duplicados en la tabla
        const groupedMap = filtered.reduce((map, r) => {
          const key = `${r.rfc}|${r.curp}|${r.qnaProceso}|${r.noComprobante}`;
          if (!map.has(key)) {
            map.set(key, { ...r, detalles: [] as NominaRow['detalles'] });
          }
          const holder = map.get(key)!;
          holder.detalles!.push({
            noComprobante: r.noComprobante,
            tipoConcepto: r.tipoConcepto,
            concepto: r.concepto,
            importe: r.importe,
          });
          return map;
        }, new Map<string, NominaRow>());
  
        const grouped = Array.from(groupedMap.values());
  
        this.dataSource.data = grouped;
        this.totalElements = grouped.length;
      },
      error: () => {
        this.dataSource.data = [];
        this.totalElements = 0;
        this.showSnack('Error al obtener la nómina', 'Cerrar', 4000);
      }
    });
  }

  loadNomina(): void {
    const qna = this.anioSeleccionado && this.quincenaSeleccionada
      ? parseInt(`${this.anioSeleccionado}${this.quincenaSeleccionada.toString().padStart(2,'0')}`, 10)
      : null;

    if (!qna) {
      this.dataSource.data = [];
      this.totalElements = 0;
      return;
    }
    this.qnaProceso = qna;
    this.lastQnaKey = `${this.anioSeleccionado}-${this.quincenaSeleccionada}`;
    this.getNomina();
  }
  
  cargarNominaPorPeriodo(anio: number, qna: number) {
    this.terceroService.getNominaCheque(anio, qna).subscribe(resp => {

      const raw = resp?.data ?? [];

      const mapped: NominaRow[] = raw.map((row: any[]) => ({
        noComprobante: row[0] ?? '—',
        ur: row[1] ?? '',
        periodo: row[2] ?? '',
        qnaProceso: qna,
        tipoNomina: row[3] ?? '',
        clavePlaza: row[4] ?? '',
        curp: row[5] ?? '',
        rfc: row[6] ?? '',
        nombreEmpleado: `${row[7] ?? ''} ${row[8] ?? ''} ${row[9] ?? ''}`.trim(),
        tipoConcepto: row[10] ?? '',
        concepto: row[11] ?? '',
        descConcepto: row[12] ?? '',
        importe: Number(row[13]) || 0,
        baseCalculoIsr: Number(row[14]) || 0,
      }));

      this.dataSource.data = mapped;
      this.totalElements = mapped.length;
    });
  }

  editar(row: any) {
    this.selectedRow = row;
    this.detailForm.patchValue(row);
  }

  eliminar(row: any) {
    console.log('Eliminar:', this.selectedRow);
  }

  applyFilter(column: 'curp' | 'rfc' | 'nombreEmpleado', value: string) {
    this.filterValues[column] = (value ?? '').trim().toUpperCase();
    this.dataSource.filter = JSON.stringify(this.filterValues);
  }

  // Quita prefijos tipo "RFC - CURP - " y códigos tipo RFC/CURP al inicio
  private limpiarNombreCompleto(s?: string): string {
    const raw = (s ?? '').toString().replace(/\s{2,}/g, ' ').trim();
    if (!raw) return '';

    const lastSeg = raw.split('-').map(x => x.trim()).filter(Boolean).pop() ?? raw;
    const sinCodigosInicio = lastSeg.replace(/^(?:[A-Z0-9]{13,18}\s*)+/, '').trim();
    return sinCodigosInicio.replace(/\s{2,}/g, ' ').trim();
  }


  verNomina(row: any) {

  const nombreCompleto = (row.nombreEmpleado || '').trim().split(' ');

  const apellidoPaterno = nombreCompleto[0] || '';
  const apellidoMaterno = nombreCompleto[1] || '';
  const nombres = nombreCompleto.slice(2).join(' ') || '';

  const detalles = (row.detalles && row.detalles.length)
    ? row.detalles
    : (this.dataSource.data as NominaRow[])
        .filter(d => d.noComprobante === row.noComprobante && d.rfc === row.rfc && d.curp === row.curp)
        .map(d => ({
          noComprobante: d.noComprobante,
          tipoConcepto: d.tipoConcepto,
          concepto: d.concepto,
          importe: Number(d.importe) || 0,
        }));

  const dialogRef = this.dialog.open(TercerosDialog, {
    width: '1200px',
    maxWidth: '92vw',
    maxHeight: '90vh',
    panelClass: 'terceros-dialog-panel',
    autoFocus: false,
    //position: { top: '80px' },

    data: {
      rfc: row.rfc,
      curp: row.curp,
      apellidoPaterno,
      apellidoMaterno,
      nombres,
      numeroDocumento: row.numeroDocumento,
      tipoOrden: row.tipoOrden,
      importeMensual: row.importeMensual,
      estatus: row.estatus,
      detalles
    }
  });

  dialogRef.afterClosed().subscribe(result => {
  if (!result) return;

  this.terceroService.guardarTercero(result).subscribe({
    next: () => {
      this.dialog.open(PensionAlimenDialog, {
        width: '500px',
        disableClose: true,
        data: {
           mensaje: 'Se guardó correctamente' 
          }
      });
    },
    error: (err) => {
      this.showSnack('Error al guardar', 'Cerrar', 4000);
    }
  });
});
  }

  cargarNominaTercero() {
  const row = this.dataSource.data[0];
    this.terceroService.getNominaCheque(
      undefined,
      undefined,
      row?.rfc,
      row?.curp
    ).subscribe(resp => {
      const raw = resp?.data ?? [];

      const mapped: NominaRow[] = raw.map((row: any[]) => ({
        noComprobante: row[0] ?? '—',
        ur: row[1] ?? '',
        periodo: row[2] ?? '',
        qnaProceso: null, 
        tipoNomina: row[3] ?? '',
        clavePlaza: row[4] ?? '',
        curp: row[5] ?? '',
        rfc: row[6] ?? '',
        nombreEmpleado: `${row[7] ?? ''} ${row[8] ?? ''} ${row[9] ?? ''}`.trim(),
        tipoConcepto: row[10] ?? '',
        concepto: row[11] ?? '',
        descConcepto: row[12] ?? '',
        importe: Number(row[13]) || 0,
        baseCalculoIsr: Number(row[14]) || 0,
      }));
      const groupedMap = mapped.reduce((map, r) => {
        const key = `${r.rfc}|${r.curp}|${r.noComprobante}`;

        if (!map.has(key)) {
          map.set(key, { ...r, detalles: [] as any[] });
        }

        const holder = map.get(key)!;
        holder.detalles.push({
          noComprobante: r.noComprobante,
          tipoConcepto: r.tipoConcepto,
          concepto: r.concepto,
          importe: r.importe
        });

        return map;
      }, new Map<string, any>());

      const grouped = Array.from(groupedMap.values());

      this.dataSource.data = grouped;
      this.totalElements = grouped.length;
    });
  }

  clearFilters(): void {
    this.form.patchValue({
      busqueda: {
        searchText: '',
        empleadoId: null,
        rfc: '',
        primerApellido: '',
        segundoApellido: '',
        nombre: ''
      },
      empleado: {
        rfc: '',
        primerApellido: '',
        segundoApellido: '',
        nombre: ''
      }
    }, { emitEvent: false });
      this.resultado = [];
      this.autocompleteTrigger?.closePanel();
      this.dataSource.data = [];
      this.beneficiarios = [];
      this.totalElements = 0;
      this.anioSeleccionado = null;
      this.quincenaSeleccionada = null;
      this.paginator?.firstPage?.();
      this.cd.markForCheck();
  }

  enforceUppercase(evt: Event) {
    const input = evt.target as HTMLInputElement;
    input.value = (input.value ?? '').toUpperCase();
  }

  cargarConceptos(){
    this.terceroService.obtenerConceptos().subscribe({
      next: (resp) => {
        const data = resp?.data ?? resp;
        this.concepto = data;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar conceptos:', err);
      }
    });
  }
}

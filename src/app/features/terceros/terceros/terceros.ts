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
import { MatInputModule } from '@angular/material/input';
import { MatDialog } from '@angular/material/dialog';
import { TercerosDialog } from '../../../shared/dialogs/terceros-dialog/terceros-dialog';
import { PensionAlimenDialog } from '../../../features/nomina/pension-alimen-dialog/pension-alimen-dialog';
import { EmpleadoItem } from '../../../models/emplado.model';
import { Observable, tap, map } from 'rxjs';
import { MatOptionModule } from '@angular/material/core';
import { ConceptoAccesoService } from '../../../core/services/concepto-acceso.service';

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
    MatOptionModule
  ],
  templateUrl: './terceros.html',
  styleUrl: './terceros.css'
})
export class Terceros {
  @ViewChild(MatAutocompleteTrigger) autocompleteTrigger?: MatAutocompleteTrigger;
  @ViewChild(MatPaginator) paginator?: MatPaginator;

  dataSource = new MatTableDataSource<NominaRow>([]);
  filterValues: any = { search: '', estatus: '' };
  displayedColumns: string[] = [ 'rfc', 'curp', 'nombreCompleto', 'acciones'];
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
  conceptosOptions$!: Observable<any[]>;
  conceptoUnicoPermitido: any | null = null;

  constructor(
    private fb: FormBuilder, 
    private snackBar: MatSnackBar,
    private zone: NgZone,
    private cd: ChangeDetectorRef,
    private dialog: MatDialog,
    private terceroService: TerceroService,
    private conceptoAccesoService: ConceptoAccesoService,
  ) {}


  ngOnInit() {
    this.form = this.fb.group({ 
      anio: [null],
      quincena: [null],
      tipoOrden: [null],
      estatus: [null],

      busqueda: this.fb.group({
        empleadoId: [null],
        searchText: [''],
        concepto: [null],
        tipoOrden: [null]
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

    const permitidos = this.conceptoAccesoService.getConceptosPermitidosRegistroTerceros();

    this.conceptosOptions$ = this.terceroService.obtenerConceptos().pipe(
      map((rows: any[]) => {
        if (!permitidos || permitidos.length === 0) return rows ?? [];
        const allowed = new Set(permitidos.map(c => String(c).trim().toUpperCase()));
        return (rows ?? []).filter(r => allowed.has(String(r?.cve ?? '').trim().toUpperCase()));
      }),
      tap((rows: any[]) => {
        if ((permitidos?.length ?? 0) === 1 && (rows?.length ?? 0) === 1) {
          this.conceptoUnicoPermitido = rows[0] ?? null;
          this.form.get('busqueda.concepto')?.setValue(rows[0]?.cve ?? null, { emitEvent: false });
          this.form.get('busqueda.concepto')?.disable({ emitEvent: false });
        } else {
          this.conceptoUnicoPermitido = null;
        }
      })
    );
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.paginator) {
        this.dataSource.paginator = this.paginator;
      }
    }, 0);
  }

  private showSnack(message: string, action: string, duration: number): void {
    this.zone.runOutsideAngular(() => {
      setTimeout(() => {
        this.zone.run(() => this.snackBar.open(message, action, { duration }));
      }, 50);
    });
  }

  private getCurrentQna(): { anio: number; qna: number; aaaaqq: number } {
    const now = new Date();
    const anio = now.getFullYear();
    const mes = now.getMonth() + 1;
    const qnaDelMes = (now.getDate() <= 15) ? 1 : 2;
    const qna = (mes - 1) * 2 + qnaDelMes;
    return { anio, qna, aaaaqq: anio * 100 + qna };
  }

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
        const filtrados = (lista ?? []).filter(e => {
          const rfc = (e.rfc ?? e.RFC ?? '').trim();
          const curp = (e.curp ?? e.CURP ?? '').trim();
          const pa = (e.primerApellido ?? e.primer_apellido ?? '').trim();
          const sa = (e.segundoApellido ?? e.segundo_apellido ?? '').trim();
          const nombre = (e.nombre ?? '').trim();
          const empleadoStr = (e.empleado ?? '').trim();
          const nombreCompleto = (e.nombreCompleto ?? '').trim();
          return !!(rfc || curp || pa || sa || nombre || empleadoStr || nombreCompleto);
        });

        setTimeout(() => {
          this.resultado = filtrados;
          this.cargandoBusqueda = false;

          if (this.resultado.length > 0) {
            this.autocompleteTrigger?.openPanel();
          } else {
            this.autocompleteTrigger?.closePanel();
          }
        }, 0);
      },
      error: () => {
        setTimeout(() => {
          this.cargandoBusqueda = false;
          this.showSnack('Error en la busqueda', 'Cerrar', 4000);
        }, 0);
      }
    });
  }

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
  }

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
  
  editar(row: any) {
    this.selectedRow = row;
    this.detailForm.patchValue(row);
  }

  verDetalles(row: any) {
    const nombreCompleto = (row.nombreEmpleado || '').trim().split(' ');
    const apellidoPaterno = nombreCompleto[0] || '';
    const apellidoMaterno = nombreCompleto[1] || '';
    const nombres = nombreCompleto.slice(2).join(' ') || '';
    const conceptoSeleccionado = this.form.get('busqueda.concepto')?.value;

    if (!row?.rfc) {
      this.showSnack('Selecciona un empleado válido', 'Cerrar', 4000);
      return;
    }

    if (!conceptoSeleccionado) {
      this.showSnack('Selecciona un concepto', 'Cerrar', 4000);
      return;
    }

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

    const qnaProceso = this.getCurrentQna().aaaaqq;
    const dialogRef = this.dialog.open(TercerosDialog, {
      width: '1200px',
      maxWidth: '92vw',
      maxHeight: '90vh',
      panelClass: 'terceros-dialog-panel',
      autoFocus: false,
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
          concepto: conceptoSeleccionado,
          qnaProceso,
          detalles
        }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
        const { archivoPdf, ...payload } = result as any;
        this.terceroService.registrarNp(payload).subscribe({
          next: (res: any) => {
            if (res?.success) {
              this.dialog.open(PensionAlimenDialog, {
                width: '500px',
                disableClose: true,
                data: {
                  mensaje: 'Se guardó correctamente'
                }
              });
              return;
            }

            const msg = res?.message || 'Error al guardar';
            this.showSnack(msg, 'Cerrar', 5000);
          },
          error: () => {
            this.showSnack('Error al guardar', 'Cerrar', 4000);
          }
        });
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

}

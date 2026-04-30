import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, NgZone, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { UppercaseDirective } from '../../../shared/directives/upperCase.directivas';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EmpleadoItem } from '../../../models/emplado.model';
import { TerceroService } from '../../../core/services/tercero.service';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { NominaRow } from '../../../models/nomina-Row.model';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { PensionAlimenDialog } from '../../nomina/pension-alimen-dialog/pension-alimen-dialog';
import { DialogTerceroInstitucional } from '../../../shared/dialogs/dialog-tercero-institucional/dialog-tercero-institucional';
import { MatDialog } from '@angular/material/dialog';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-registro-tercero-institucional',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    MatTableModule,
    MatSelectModule,
    MatOptionModule,
    UppercaseDirective 
  ],
  templateUrl: './registro-tercero-institucional.html',
  styleUrl: './registro-tercero-institucional.css'
})
export class RegistroTerceroInstitucional {

  form!: FormGroup;
  resultado: EmpleadoItem[] = [];
  cargandoBusqueda = false;
  totalElements = 0;
  conceptosFiltrados: any[] = [];
  displayedColumns: string[] = [ 'rfc', 'nombreCompleto', 'tipoMovimiento', 'concepto', 'qnaProceso', 'acciones'];
  readonly conceptosPermitidos = ['5l', '6l', '21'];
  empleadoActual: EmpleadoItem | null = null;
  dataSource = new MatTableDataSource<NominaRow>([]);
  @ViewChild(MatAutocompleteTrigger) autocompleteTrigger?: MatAutocompleteTrigger;
  @ViewChild(MatPaginator) paginator?: MatPaginator;

  constructor(
    private fb: FormBuilder, 
    private snackBar: MatSnackBar, 
    private zone: NgZone,
    private cd: ChangeDetectorRef,
    private dialog: MatDialog,
    private terceroService: TerceroService
  ) {}

  private showSnack(message: string, action: string, duration: number): void {
    this.zone.runOutsideAngular(() => {
      setTimeout(() => {
        this.zone.run(() => this.snackBar.open(message, action, { duration }));
      }, 50);
    });
  }

  ngOnInit() {
     this.form = this.fb.group({ 
       busqueda: this.fb.group({
        empleadoId: [null],
        searchText: [''],
        concepto: [null],
        tipoConcepto: [2],
        qnaProceso: [null],
        }),

      
      });
      this.form.patchValue({
        busqueda: { 
          qnaProceso: this.getCurrentQna() 
        }
      }, { emitEvent: false });
      this.cargarConceptos();
       this.form.get('busqueda.concepto')?.valueChanges
        .subscribe((c) => {
          if (!c?.cve) {
            this.dataSource.data = [];
            this.totalElements = 0;
            return;
          }
        this.paginator?.firstPage?.();
        this.buscarRegistrosNp(0, this.paginator?.pageSize ?? 50);
      });
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

      
      this.empleadoActual = emp;
      this.dataSource.data = [row];
      this.totalElements = 1;
      this.resultado = [];
      this.autocompleteTrigger?.closePanel();
  }

  verDetalles(row: any) {
      const conceptoSeleccionado = this.form.get('busqueda.concepto')?.value ?? null;
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
  
      const dialogRef = this.dialog.open(DialogTerceroInstitucional, {
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
            detalles
          }
      });
  
      dialogRef.afterClosed().subscribe(result => {
        if (!result) return;
        const req$ = row?.id ? this.terceroService.editarRegistroNp(row.id, result) : this.terceroService.registrarNp(result);
        req$.subscribe({
          next: () => {
            this.buscarRegistrosNp(this.paginator?.pageIndex ?? 0, this.paginator?.pageSize ?? 50);
            this.dialog.open(PensionAlimenDialog, {
              width: '500px',
              disableClose: true,
              data: {
                type: 'success',
                title: 'Éxito',
                message: row?.id ? 'Se actualizó correctamente' : 'Se guardó correctamente'
              }
            });
          },
          error: (err) => {
            const msg = err?.error?.message || err?.error?.mensaje || 'Error al guardar';
            this.showSnack(msg, 'Cerrar', 4000);
          }
        });
      });
  }

  cargarConceptos(): void {
    this.terceroService.obtenerConceptos().subscribe({
      next: (data) => {
        this.conceptosFiltrados = (data ?? []).filter((c: any) =>
          this.conceptosPermitidos.includes((c?.cve ?? '').toString().toLowerCase())
        );

        this.conceptosFiltrados = this.dedupeByCve(this.conceptosFiltrados);
        this.conceptosFiltrados = this.ordenarPorPrioridad(
          this.conceptosFiltrados,
          this.conceptosPermitidos
        );

        this.cd.markForCheck();
      },
      error: (err) => console.error('Error al cargar conceptos:', err),
    });
  }

  private ordenarPorPrioridad(conceptos: any[], codigosPrioridad: string[]): any[] {
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

  private dedupeByCve(conceptos: any[]): any[] {
    const map = new Map<string, any>();

    for (const c of conceptos ?? []) {
      const key = (c?.cve ?? '').toString().toLowerCase().trim();
      if (!key) continue;

      if (!map.has(key)) map.set(key, c);
    }

    return Array.from(map.values());
  }

  private getCurrentQna(): number {
    const now = new Date();
    const anio = now.getFullYear();
    const mes = now.getMonth() + 1;
    const qnaDelMes = (now.getDate() <= 15) ? 1 : 2;
    const qna = (mes - 1) * 2 + qnaDelMes;
    return anio * 100 + qna;
  }

  buscarRegistrosNp(pageIndex: number = 0, pageSize: number = 50): void {
    const conceptoObj = this.form.get('busqueda.concepto')?.value ?? null;
    const concepto = conceptoObj?.cve ? String(conceptoObj.cve).trim() : null;
    const qnaProceso = this.form.get('busqueda.qnaProceso')?.value ?? null; 
    this.terceroService.obtenerRegistrosNp({
      qnaProceso,
      concepto,
      page: pageIndex,
      size: pageSize,
    }).subscribe({
      next: (res) => {
        this.totalElements = res.total ?? 0;
        const rows: NominaRow[] = (res.rows ?? []).map((r: any) => ({
          id: r.id,
          rfc: r.rfc,
          nombreEmpleado: r.nombreTrabajador ?? r.nombre_empleado ?? '',
          tipoMovimiento: r.tipoOrden === 1 ? 'ALTA' : r.tipoOrden === 2 ? 'BAJA' : '',
          concepto: r.conceptoDescuento ?? r.concepto_descuento ?? r.concepto ?? '',
          qnaProceso: r.qnaProceso ?? r.qna_proceso ?? null,
        } as any));
        this.dataSource.data = rows;
        this.cd.markForCheck();
      },
      error: () => this.showSnack('Error al consultar registros NP', 'Cerrar', 4000),
    });
  }

  abrirAgregar(): void {
    const emp = this.empleadoActual;
    const conceptoSeleccionado = this.form.get('busqueda.concepto')?.value ?? null;

    if (!emp) {
      this.showSnack('Selecciona un empleado', 'Cerrar', 3000);
      return;
    }

    if (!conceptoSeleccionado?.cve) {
      this.showSnack('Selecciona un concepto', 'Cerrar', 3000);
      return;
    }

    let rfc = String(emp.rfc ?? emp.RFC ?? '').trim();

    if (!rfc) {
      const empleadoStr = String(emp.empleado ?? '').trim();
      const parts = empleadoStr.split(' - ').map(p => p.trim());
      if (parts.length >= 1) rfc = parts[0] ?? '';
    }

    const curp = String(emp.curp ?? emp.CURP ?? '').trim();
    const empleadoStr = String(emp.empleado ?? '').trim();
    const [ ...nombrePartsRaw] = empleadoStr.split(' - ').map(s => s.trim());
    const nombreCompleto = nombrePartsRaw.join(' - ').trim();
    const p = nombreCompleto.split(' ').filter(Boolean);
    const apellidoPaterno = p[0] ?? '';
    const apellidoMaterno = p[1] ?? '';
    const nombres = p.slice(2).join(' ');
      const dialogRef = this.dialog.open(DialogTerceroInstitucional, {
        width: '1200px',
        maxWidth: '92vw',
        maxHeight: '90vh',
        panelClass: 'terceros-dialog-panel',
        autoFocus: false,
        data: {
          rfc,
          curp,
          apellidoPaterno,
          apellidoMaterno,
          nombres,
          concepto: conceptoSeleccionado,
          detalles: []
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (!result) return;

        this.terceroService.registrarNp(result).subscribe({
          next: () => {
            this.buscarRegistrosNp(this.paginator?.pageIndex ?? 0, this.paginator?.pageSize ?? 50);
            this.dialog.open(PensionAlimenDialog, {
              width: '500px',
              disableClose: true,
              data: { type: 'success', title: 'Éxito', message: 'Se guardó correctamente' }
            });
          },
          error: (err) => {
            const msg = err?.error?.message || err?.error?.mensaje || 'Error al guardar';
            this.showSnack(msg, 'Cerrar', 4000);
          }
        });
      });
  }


  onPageChange(e: any): void {
    this.buscarRegistrosNp(e.pageIndex, e.pageSize);
  }

  clearFilters(): void {
    this.form.patchValue({
      busqueda: {
        searchText: '',
        empleadoId: null,
        rfc: '',
        primerApellido: '',
        segundoApellido: '',
        nombre: '',
        concepto: null,
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
      
      this.totalElements = 0;
    
      this.paginator?.firstPage?.();
      this.cd.markForCheck();
  }

}

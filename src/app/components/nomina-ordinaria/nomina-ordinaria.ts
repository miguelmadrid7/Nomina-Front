import { Component, OnInit, AfterViewInit, ViewChild, NgZone } from '@angular/core';
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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NominaRow } from '../../interfaces/nomina-row-inter';

@Component({
  selector: 'app-nomina-ordinaria',
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatSelectModule,
    MatTableModule,
    MatPaginatorModule,
    MatOption,
    MatDialogModule,
    MatInputModule,
    MatSnackBarModule,
  ],
  templateUrl: './nomina-ordinaria.html',
  styleUrl: './nomina-ordinaria.css',
})
export class NominaOrdinaria implements OnInit, AfterViewInit {

  dataSource = new MatTableDataSource<NominaRow>([]);
  //displayedColumns: string[] = ['curp', 'rfc', 'nombreEmpleado', 'qnaProceso', 'nivelSueldo', 'concepto', 'totalImporteQnal'];

  displayedColumns: string[] = [
  'curp',
  'rfc',
  'nombreEmpleado',
  'qnaProceso',
  'clavePlaza',
  'conceptoDetalle',
];
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


  // Control de refrescos y QNA
  private isRefreshing = false;
  private filtersReady = false;
  private lastQnaKey: string | null = null;
  private qnaDebounceId: any;


  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private nominaService: NominaService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
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

  this.nominaService.getNominaCheque().subscribe({
    next: (response) => {

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
      }));

      const targetQna = parseInt(`${this.anioSeleccionado}${this.quincenaSeleccionada.toString().padStart(2,'0')}`, 10);
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
      this.isRefreshing = false;
    },
    error: () => {
      this.clearTable();
      this.isRefreshing = false;
    }
  });
}


  openConceptosDialog(row: any) {
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

    this.dialog.open(NominaordConceptoDialog, {
      panelClass: 'nomina-dialog-wide',
      data: {
        empleadoId: row.empleadoId,
        nombreEmpleado: row.nombreEmpleado,
        curp: row.curp,
        rfc: row.rfc,
        qnaTexto: `${this.anioSeleccionado}/${this.quincenaSeleccionada.toString().padStart(2,'0')}`,
        detalles
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

  executePayrollProcess(): void {

  const qna = this.anioSeleccionado && this.quincenaSeleccionada
    ? parseInt(`${this.anioSeleccionado}${this.quincenaSeleccionada.toString().padStart(2, '0')}`, 10)
    : null;

  if (!qna) {
    this.showSnack('Selecciona una quincena y año válidos.', 'Cerrar', 4000);
    return;
  }


  this.nominaService.executePayrollProcess(qna).subscribe({
    next: () => {
      // Aquí simplemente simulas finalización inmediata
      this.refresh();
      this.showSnack('Proceso completado correctamente', 'Cerrar', 3000);
    },
    error: () => {
      this.showSnack('Error al ejecutar el proceso', 'Cerrar', 4000);
    }
  });
  }

}

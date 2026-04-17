import { Component, OnInit, AfterViewInit, ViewChild, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { NominaService } from '../../../core/services/nomina-ordinaria.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NominaordConceptoDialog } from '../../nomina/nominaord-concepto-dialog/nominaord-concepto-dialog';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NominaRow } from '../../../models/nomina-Row.model';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LoaderService } from '../../../core/services/loader.service';
import { finalize } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-nomina-ordinaria',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatButtonModule,
    MatSelectModule,
    MatTableModule,
    MatPaginatorModule,
    MatOption,
    MatDialogModule,
    MatInputModule,
    MatSnackBarModule,
    MatIconModule
  ],
  templateUrl: './nomina-ordinaria.html',
  styleUrls: ['./nomina-ordinaria.css'],
})
export class NominaOrdinaria implements OnInit, AfterViewInit {

  dataSource = new MatTableDataSource<NominaRow>([]);
  displayedColumns: string[] = ['curp', 'rfc', 'nombreEmpleado', 'qnaProceso', 'clavePlaza', 'baseCalculoIsr', 'conceptoDetalle',];

  anios: number[] = [2026, 2025, 2024];
  quincenas: number[] = Array.from({ length: 24 }, (_, i) => i + 1);
  anioSeleccionado = 2026;
  quincenaSeleccionada = 1;
  search: string = '';

  qnaProceso!: number;
  empleadoId?: number;
  nivelSueldo?: number;
  concepto?: string[];
  tipoConcepto?: string;
  totalElements = 0;

  showRecords = true;


  // Control de refrescos y QNA
  private isRefreshing = false;
  private filtersReady = true;
  private lastQnaKey: string | null = null;
  private qnaDebounceId: any;


  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private nominaService: NominaService,
    private loaderService: LoaderService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private zone: NgZone
  ) {}

  ngOnInit(): void {
    this.dataSource.filterPredicate = (data: any, filter: string) => {
    const search = filter.trim().toUpperCase();
      return (
        (data.curp ?? '').toUpperCase().includes(search) ||
        (data.rfc ?? '').toUpperCase().includes(search) ||
        (data.nombreEmpleado ?? '').toUpperCase().includes(search)
      );
    };
    this.loadNomina()
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.paginator) {
        this.dataSource.paginator = this.paginator;
      }
    }, 0);
  }

  // Método helper de la clase
  private showSnack(message: string, action: string, duration: number): void {
    this.zone.runOutsideAngular(() => {
      setTimeout(() => {
        this.zone.run(() => this.snackBar.open(message, action, { duration }));
      }, 50);
    });
  }

  applySearchFilter() {
    const value = (this.search || '').trim().toUpperCase();
    this.dataSource.filter = value;
  }

  onQnaChange(): void {
    if (!this.showRecords || !this.filtersReady) return;
    clearTimeout(this.qnaDebounceId);
    this.qnaDebounceId = setTimeout(() => {
      const key = `${this.anioSeleccionado}-${this.quincenaSeleccionada}`;
      if (this.lastQnaKey !== key && !this.isRefreshing) {
        this.lastQnaKey = key;
        this.loadNomina();
      }
    }, 0);
  }


  refreshIfQnaChanged(): void {
    const key = `${this.anioSeleccionado}-${this.quincenaSeleccionada}`;
    if (this.lastQnaKey === key || this.isRefreshing) return;
    this.lastQnaKey = key;
    this.loadNomina();
  }

  loadNomina(): void {
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
    this.lastQnaKey = `${this.anioSeleccionado}-${this.quincenaSeleccionada}`;
    this.getNomina();
  }

  clearTable(): void {
    this.dataSource.data = [];
    this.totalElements = 0;
  }

  getNomina(): void {
    if (this.isRefreshing) return;
      this.isRefreshing = true;
      this.loaderService.show();

      this.nominaService.getNominaCheque().pipe(
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
    },
    error: () => {
      this.clearTable();
      this.showSnack('Error al obtener la nómina', 'Cerrar', 4000);
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
      width: '850px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      autoFocus: false,
      position: { top: '80px' },
      //panelClass: 'brand-dialog',
      data: {
        empleadoId: row.empleadoId,
        nombreEmpleado: row.nombreEmpleado,
        curp: row.curp,
        rfc: row.rfc,
        plaza: row.clavePlaza,
        qnaTexto: `${this.anioSeleccionado}/${this.quincenaSeleccionada.toString().padStart(2,'0')}`,
        detalles
      }
    });
  }

  enforceUppercase(evt: Event) {
    const input = evt.target as HTMLInputElement;
    input.value = (input.value ?? '').toUpperCase();
  }

  clearFilters(): void {
    this.search = '';
    this.dataSource.filter = '';
    this.anioSeleccionado = 2026;
    this.quincenaSeleccionada = 1;
    if (this.showRecords) {
      this.refreshIfQnaChanged();
    }
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
        this.loadNomina();
        this.showSnack('Proceso completado correctamente', 'Cerrar', 3000);
      },
      error: () => {
        this.showSnack('Error al ejecutar el proceso', 'Cerrar', 4000);
      }
    });
  }
}

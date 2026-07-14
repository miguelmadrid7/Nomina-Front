import { Component, OnInit, AfterViewInit, ViewChild, NgZone, inject, OnDestroy } from '@angular/core';
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
import { NominaordConceptoDialog } from '../../../shared/dialogs/nominaord-concepto-dialog/nominaord-concepto-dialog';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NominaRow } from '../../../core/model/nomina-Row.model';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LoaderService } from '../../../core/services/loader.service';
import { finalize } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { UppercaseDirective } from "../../../shared/directives/upperCase.directivas";
import { buildQnaCode, groupNominaRows, mapRawRowToNominaRow } from '../../../shared/helpers/nomina.helper';
import { DateYearsHelper } from '../../../shared/helpers/date-years.helper';

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
    MatIconModule,
    UppercaseDirective
],
  templateUrl: './nomina-ordinaria.html',
  styleUrls: ['./nomina-ordinaria.css'],
})
export class NominaOrdinaria implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  dataSource = new MatTableDataSource<NominaRow>([]);
  readonly displayedColumns: string[] = [
    'curp', 
    'rfc', 
    'nombreEmpleado', 
    'qnaProceso', 
    'clavePlaza', 
    'baseCalculoIsr', 
    'conceptoDetalle'
  ];

  anios: number[] = [];
  quincenas: number[] = [];

  anioSeleccionado: number | null = null;
  quincenaSeleccionada: number | null = null;
  
  search: string = '';
  qnaProceso!: number;
  totalElements = 0;
  showRecords = true;

  private isRefreshing = false;
  private filtersReady = true;
  private lastQnaKey: string | null = null;
  private qnaDebounceId: any;

  private readonly nominaService = inject(NominaService);
  private readonly loaderService = inject(LoaderService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly zone = inject(NgZone);

  ngOnInit(): void {
    this.anios = DateYearsHelper.getYears(1,1);
    this.quincenas = DateYearsHelper.getQna();
    
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

  ngOnDestroy () {
    this.dialog.closeAll();
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

  applySearchFilter(): void {
    if (!this.anioSeleccionado || !this.quincenaSeleccionada) {
      this.showSnack('Debe seleccionar Año y Quincena','Cerrar',4000);
      return;
    }
    const value = (this.search || '').trim().toUpperCase();
    if (!value) {
      this.showSnack('Debe ingresar un CURP, RFC o nombre de empleado','Cerrar', 4000);
      return;
    }
    this.dataSource.filter = value;
    if (this.paginator) {
      this.paginator.firstPage();
    }
  }
  onQnaChange(): void {
    if (!this.showRecords || !this.filtersReady) return;
      clearTimeout(this.qnaDebounceId);
      this.qnaDebounceId = setTimeout(() => {
        if (this.anioSeleccionado && !this.quincenaSeleccionada) {
          this.loaderService.show();
          this.dataSource.data = [];
          this.totalElements = 0;
        setTimeout(() => {
          this.loaderService.hide();
        }, 4000);
      return;
    }
    const key = `${this.anioSeleccionado}-${this.quincenaSeleccionada}`;
      if (this.lastQnaKey !== key && !this.isRefreshing) {
        this.lastQnaKey = key;
        this.loadNomina();
      }
    }, 0);
  }

  loadNomina(): void {
    if (!this.anioSeleccionado || !this.quincenaSeleccionada) {
      this.dataSource.data = [];
      this.totalElements   = 0;
      return;
    }
    this.qnaProceso  = buildQnaCode(this.anioSeleccionado, this.quincenaSeleccionada);
    this.lastQnaKey  = `${this.anioSeleccionado}-${this.quincenaSeleccionada}`;
    this.getNomina();
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
      const targetQna = buildQnaCode(this.anioSeleccionado!, this.quincenaSeleccionada!);
      const grouped = groupNominaRows(
        (response?.data ?? [])
          .map(mapRawRowToNominaRow)
          .filter((r: NominaRow) => r.qnaProceso === targetQna)
      );
      this.dataSource.data = grouped;
      this.totalElements   = grouped.length;
    },
      error: () => {
        this.dataSource.data = [];
        this.totalElements   = 0;
        this.showSnack('Error al obtener la nómina', 'Cerrar', 4000);
      },
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
      width: '950px',
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
        qnaTexto: `${this.anioSeleccionado}/${this.quincenaSeleccionada?.toString().padStart(2,'0')}`,
        detalles
      }
    });
  }

  clearFilters(): void {
    this.loaderService.show();
    this.search = '';
    this.dataSource.filter = '';
    this.anioSeleccionado = null;
    this.quincenaSeleccionada = null;
    this.dataSource.data = [];
    this.totalElements = 0;
      setTimeout(() => {
        this.loaderService.hide();
      }, 4000); 
  }
}

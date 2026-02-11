import { Component, OnInit, ViewChild } from '@angular/core';
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
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-nomina-ordinaria',
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOption,
    MatDialogModule,
    MatInputModule,
    MatProgressBarModule
  ],
  templateUrl: './nomina-ordinaria.html',
  styleUrl: './nomina-ordinaria.css'
})
export class NominaOrdinaria implements OnInit {

  dataSource = new MatTableDataSource<any>([]);
  displayedColumns: string[] = ['curp', 'rfc', 'nombreEmpleado', 'qnaProceso', 'nivelSueldo', 'concepto', 'totalImporteQnal'];
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

  loading = false;
  progress =0;


  constructor(private nominaService: NominaService, private dialog: MatDialog) {}

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

  @ViewChild(MatPaginator) set matPaginator(p: MatPaginator) {
    if (p) this.dataSource.paginator = p;
  }

  showRecordsTable(): void {
    this.showRecords = true;
    this.refresh();
  }

  hideRecordsTable(): void {
    this.showRecords = false;
    this.clearTable();
  }

  onAnioChange(): void {
    if (this.showRecords) this.refresh();
  }

  onQuincenaChange(): void {
    if (this.showRecords) this.refresh();
  }


  /*
   * Este metodo calcula la qna + año seleccionado
   */
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
    this.fetchNomina();
  }



  private clearTable(): void {
    this.dataSource.data = [];
    this.totalElements = 0;
  }

  private isApplicableConcept(c: any, target: number): boolean {
    const qp = c?.qnaProceso;
    const ini = c?.qnaIni;
    const fin = c?.qnaFin;

    return (qp === target) || (
      typeof ini === 'number' &&
      typeof fin === 'number' &&
      ini <= target &&
      fin >= target
    );
  }

  private pickConcept(conceptos: any[], target: number): any | null {
    if (!Array.isArray(conceptos) || conceptos.length === 0) return null;

    return (
      conceptos.find(c => c?.qnaProceso === target) ??
      conceptos.find(c => this.isApplicableConcept(c, target)) ??
      conceptos[0] ??
      null
    );
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
    this.loading = true;
    this.progress = 0;

    this.nominaService.getCalculation({
      qnaProceso: this.qnaProceso,
      empleadoId: this.empleadoId,
      nivelSueldo: this.nivelSueldo,
      concepto: this.concepto,
      tipoConcepto: this.tipoConcepto
    })
    .subscribe({
      next: (response) => {
        this.progress = 60;
        const data = this.adaptResponse(response?.data ?? [], this.qnaProceso);
        this.dataSource.data = data;
        this.totalElements = data.length;

        this.progress = 100;
        setTimeout(() => {
          this.loading = false;
          this.progress = 0;
        }, 300);
      },
      error: (err) => {
        console.error('Error backend (500)', err);
        this.clearTable();

        this.loading = false;
        this.progress = 0;
      }
    });
  }

  /*
   * Este metodo hace la funcion de descargar el excel con el nombre de Nomina_Calculada
   */
  downloadExcel(): void {
    const qna =
      this.anioSeleccionado && this.quincenaSeleccionada
      ? parseInt(`${this.anioSeleccionado}${this.quincenaSeleccionada.toString().padStart(2,'0')}`, 10)
      : null;

    if (!qna) return;
    this.nominaService.downloadExcel({
      qnaProceso: qna,
      nivelSueldo: this.nivelSueldo,
      conceptos: this.concepto,
      empleadoId: this.empleadoId,
      tipoConcepto: this.tipoConcepto
    }).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Calculo_Nomina.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Error descargando Excel', err);
      }
    });
  }

  /*
  * Este metodo tiene la funcion de pasarle los parametros al dialogo del componente de nomina-concepto-dialog
  */
  openConceptosDialog(row: any) {
      this.dialog.open(NominaordConceptoDialog, {
        panelClass: 'nomina-dialog-wide',
        data: {
          empleadoId: row.empleadoId,
          nombreEmpleado: row.nombreEmpleado,
          qnaProceso: row.qnaProceso,
          conceptos: row.conceptos ?? [],
          curp: row.curp,
          rfc: row.rfc,
        }
      });
  }

  /*
  * Este metodo aplica cmomo tal los filtros de los inpust de CURP, RFC y NOMBRE DEL EMPLEADO
  */
  applyFilter( column: 'curp' | 'rfc' |'nombreEmpleado', value: string) {
    this.filterValues[column] = (value ?? '').trim().toUpperCase();
    this.dataSource.filter = JSON.stringify(this.filterValues);
  }

  /**
   * Este metodo es para qiue el input muestre que cuando se escribe estan en mayusculas
   */
  enforceUppercase(evt: Event) {
    const input = evt.target as HTMLInputElement;
    input.value = (input.value ?? '').toUpperCase();
  }


  /*
  * Este metodo sirve para hacer la limpieza de los filtros de los inputs
  * Tambien limpia los filtros de las fechas de QNA a su año por defecto
  */
  clearFilters(): void {
    this.filterValues = {
      curp: '',
      rfc: '',
      nombreEmpleado: ''
    };

    this.dataSource.filter = JSON.stringify(this.filterValues);
    this.anioSeleccionado = 2026;
    this.quincenaSeleccionada = 1;

    if (this.showRecords) {
      this.refresh();
    }
  }

}

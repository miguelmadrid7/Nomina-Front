import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { finalize } from 'rxjs/operators';
import { NominaService } from '../servicios/nomina-ordinaria.service';

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
    MatOption
  ],
  templateUrl: './nomina-ordinaria.html',
  styleUrl: './nomina-ordinaria.css'
})
export class NominaOrdinaria implements OnInit {

  dataSource = new MatTableDataSource<any>([]);
  displayedColumns: string[] = [
    'empleadoId',
    'nombreEmpleado',
    'qnaProceso',
    'nivelSueldo',
    'concepto',
    'tipoConcepto',
    'totalImporteQnal'
  ];


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
  hasSearched = false;
  isLoading = false;
  private fetchSeq = 0;
  private activeFetch = 0;

  constructor(private nominaService: NominaService) {}

  ngOnInit(): void {
    //this.refresh();
  }

  @ViewChild(MatPaginator) set matPaginator(p: MatPaginator) {
    if (p) this.dataSource.paginator = p;
  }

  showRecordsTable(): void {
    if (this.isLoading) return;
    this.showRecords = true;
    this.refresh();
  }

  hideRecordsTable(): void {
    this.showRecords = false;
    this.hasSearched = false;
    this.isLoading = false;
    this.clearTable();

  }

  onAnioChange(): void {
    if (this.showRecords  && !this.isLoading)
    this.refresh();
  }

  onQuincenaChange(): void {
    if (this.showRecords  && !this.isLoading)
    this.refresh();
  }

  private refresh(): void {
    console.log('REFRESH', { isLoading: this.isLoading, anio: this.anioSeleccionado, qna: this.quincenaSeleccionada });
    if (this.isLoading) return;

    const qna = this.buildQnaProceso(this.anioSeleccionado, this.quincenaSeleccionada);
    if (!qna) {
      this.clearTable();
      return;
    }
    this.qnaProceso = qna;
    this.fetchNomina();
  }

  private buildQnaProceso(anio?: number, quincena?: number): number | null {
    if (!anio || !quincena) return null;
    return parseInt(`${anio}${quincena.toString().padStart(2, '0')}`, 10);
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
          nivelSueldo: concept?.catCategoriasCve ?? '',
          concepto: concept?.conceptoCve ?? '',
          tipoConcepto: concept?.tipoConcepto ?? (concept?.conceptoCve ?? ''),
          totalImporteQnal: item.totalImporteQnal
        };
      })
      .filter(Boolean) as any[];
  }

  private fetchNomina(): void {
    this.hasSearched = true;

    const seq = ++this.fetchSeq;
    this.activeFetch = seq;

    this.isLoading = true;
    //this.cdr.detectChanges();

    this.nominaService.getCalculation({
      qnaProceso: this.qnaProceso,
      empleadoId: this.empleadoId,
      nivelSueldo: this.nivelSueldo,
      concepto: this.concepto,
      tipoConcepto: this.tipoConcepto
    }).pipe(
      finalize(() => {
        if (this.activeFetch === seq) {
          this.isLoading = false;
          //this.cdr.detectChanges();
        }
      })
    ).subscribe({
      next: (response: any) => {
        const data = this.adaptResponse(response?.data ?? [], this.qnaProceso);
        this.dataSource.data = data;
        this.totalElements = data.length;
        //this.cdr.detectChanges();
      },
      error: err => {
        console.error('Error al cargar nómina', err);
        this.clearTable();
        //this.cdr.detectChanges();
      }
    });
  }

  downloadExcel(): void {
    const qna = this.buildQnaProceso(this.anioSeleccionado, this.quincenaSeleccionada);
    //const qna = this['buildQnaProceso'](this.anioSeleccionado, this.quincenaSeleccionada);
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
        a.download = 'calculo_nomina.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Error descargando Excel', err);
      }
    });
  }
}

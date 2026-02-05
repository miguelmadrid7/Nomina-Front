import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOption } from '@angular/material/core';

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
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;

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

  constructor(private nominaService: NominaService) {}

  ngOnInit(): void {
    console.log('AÑO EN TS:', this.anioSeleccionado);
    this.calcularNomina();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  private construirQnaProceso(): void {
    const anio = this.anioSeleccionado.toString();
    const quincena = this.quincenaSeleccionada.toString().padStart(2, '0');
    this.qnaProceso = parseInt(anio + quincena, 10);

    console.log('QNA PROCESO:', this.qnaProceso);
  }

  calcularNomina(): void {
    if (!this.anioSeleccionado || !this.quincenaSeleccionada) {
      return;
    }

    this.construirQnaProceso();
    this.loadNomina();
  }


  loadNomina(): void {
    this.nominaService.getCalculation({
      qnaProceso: this.qnaProceso,
      empleadoId: this.empleadoId,
      nivelSueldo: this.nivelSueldo,
      concepto: this.concepto,
      tipoConcepto: this.tipoConcepto
    }).subscribe({
     next: (response: any) => {
  if (!response?.data) {
    this.dataSource.data = [];
    this.totalElements = 0;
    return;
  }

  const target = this.qnaProceso;

  const filtered = (response.data as any[]).filter(item => {
    const conceptos = item.conceptos ?? [];
    return conceptos.some((c: any) => {
      const qp = c?.qnaProceso as number | undefined;
      const ini = c?.qnaIni as number | undefined;
      const fin = c?.qnaFin as number | undefined;
      return (qp === target) || (
        typeof ini === 'number' && typeof fin === 'number' && ini <= target && fin >= target
      );
    });
  });

  const adaptedData = filtered.map((item: any) => {
    const conceptos = item.conceptos ?? [];

    // 1) intenta concepto con qnaProceso exacto
    let concept = conceptos.find((c: any) => c?.qnaProceso === target);

    // 2) si no hay exacto, toma alguno vigente por rango
    if (!concept) {
      concept = conceptos.find((c: any) => {
        const ini = c?.qnaIni as number | undefined;
        const fin = c?.qnaFin as number | undefined;
        return typeof ini === 'number' && typeof fin === 'number' && ini <= target && fin >= target;
      }) ?? conceptos[0];
    }

    return {
      empleadoId: item.tab_empleados_id,
      nombreEmpleado: item.nombre_empleado,
      qnaProceso: this.qnaProceso, // muestra la quincena seleccionada
      nivelSueldo: concept?.catCategoriasCve ?? '',
      concepto: concept?.conceptoCve ?? '',
      tipoConcepto: concept?.conceptoCve ?? '',
      totalImporteQnal: item.total_importe_qnal
    };
  });

  this.dataSource.data = adaptedData;
  this.totalElements = adaptedData.length;

  if (adaptedData.length === 0) {
    console.log(`Sin coincidencias para qna ${target}. Muestra mensaje de no datos.`);
  }
},
      error: err => {
        console.error('Error al cargar nómina', err);
        this.dataSource.data = [];
        this.totalElements = 0;
      }
    });
  }

  onAnioChange(): void {
  console.log('Año seleccionado:', this.anioSeleccionado);
  this.calcularNomina();
}

onQuincenaChange(): void {
  console.log('Quincena seleccionada:', this.quincenaSeleccionada);
  this.calcularNomina();
}
}
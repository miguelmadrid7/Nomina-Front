import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, EventEmitter, inject, Output, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { JuiciosMercantilesService } from '../../../core/services/juicios-mercantiles.services';

export interface GrupoEmpleado {
  empleadoId: number;
  nombreCompleto: string;
  rfc: string;
  beneficiarios: any[];
  expandido: boolean;
}

@Component({
  selector: 'app-consulta-juicios-mercantiles',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  templateUrl: './consulta-juicios-mercantiles.html',
  styleUrl: './consulta-juicios-mercantiles.css'
})
export class ConsultaJuiciosMercantiles {

  private readonly juiciosMercantilesService = inject(JuiciosMercantilesService);
  private readonly cd = inject(ChangeDetectorRef);

  @Output() editar = new EventEmitter<any>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  grupos: GrupoEmpleado[] = [];
  dataSource = new MatTableDataSource<any>([]);
  hasCheck = false;

  displayedColumns: string[] = ['rfc', 'nombreCompleto', 'qnaProceso', 'formaAplicacion','importeTotal', 'restoPagar', 'citaBancaria', 'status', 'acciones'];
  displayedColumnsGrupo: string[] = ['grupo'];

  totalElements = 0;

 ngOnInit(): void {
  this.juiciosMercantilesService.getTodosBeneficiarios().subscribe({
    next: (resp: any) => {
      const grupos: any[] = resp?.data ?? [];

      this.grupos = grupos.map((g: any) => ({
        empleadoId: g.empleadoId,
        nombreCompleto: g.nombreCompleto,
        rfc: '',
        beneficiarios: (g.beneficiarios ?? []).map((b: any) => ({
          ...b,
          nombreCompleto: `${b?.primerApellido ?? ''} ${b?.segundoApellido ?? ''} ${b?.nombre ?? ''}`.trim(),
          importeTotal: Number(b?.importeTotal ?? 0),
          qnaini: Number(b?.qnaini ?? 0),
          qnafin: b?.qnafin != null ? Number(b.qnafin) : null,
          status: b?.estatus ?? b?.status ?? 'ACTIVO',
          numeroDocumento: b?.numeroDocumento ?? null,
          rfc: b?.rfc ?? ''
        })),
        expandido: true
      }));

      this.actualizarFlat();
      this.hasCheck = true;

      setTimeout(() => {
        this.dataSource.paginator = this.paginator;
        this.cd.markForCheck();
      });
    },
    error: () => { this.hasCheck = true; }
  });
}

  toggleGrupo(grupo: GrupoEmpleado): void {
    grupo.expandido = !grupo.expandido;
    this.actualizarFlat();
    this.cd.markForCheck();
  }

  private actualizarFlat(): void {
    const flat: any[] = [];
    for (const grupo of this.grupos) {
      flat.push({ esGrupo: true, grupo });
      if (grupo.expandido) {
        flat.push(...grupo.beneficiarios.map(b => ({ ...b, esGrupo: false })));
      }
    }
    this.dataSource.data = flat; // ← actualiza el dataSource
  }

  esFilaGrupo = (_index: number, row: any) => row.esGrupo;

  onEditar(row: any): void {
    this.editar.emit(row);
  }
}
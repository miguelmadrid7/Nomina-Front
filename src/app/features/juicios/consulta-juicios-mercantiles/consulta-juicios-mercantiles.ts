import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, inject, NgZone, Output, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { JuiciosMercantilesService } from '../../../core/services/juicios-mercantiles.services';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { UppercaseDirective } from '../../../shared/directives/upperCase.directivas';
import { AltaBeneficiarioJmDialog } from '../../../shared/dialogs/alta-beneficiario-jm-dialog/alta-beneficiario-jm-dialog';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-consulta-juicios-mercantiles',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    UppercaseDirective
  ],
  templateUrl: './consulta-juicios-mercantiles.html',
  styleUrl: './consulta-juicios-mercantiles.css'
})
export class ConsultaJuiciosMercantiles {

  private readonly juiciosMercantilesService = inject(JuiciosMercantilesService);
  private readonly cd = inject(ChangeDetectorRef);
  private readonly zone = inject(NgZone);
  private readonly dialog = inject(MatDialog); 

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  dataSource = new MatTableDataSource<any>([]);
  hasCheck = false;
  banco: any[] = [];
  totalElements = 0;
  displayedColumns: string[] = [
    'nombreEmpleado',
    'rfc', 
    'nombreCompleto', 
    'qnaProceso', 
    'formaAplicacion',
    'status', 
    'acciones'
  ];

  private todosLosRegistros: any[] = [];

  searchForm = new FormGroup({
    searchText: new FormControl('')
  });

  ngOnInit(): void {
    this.loadBanks();
    this.loadBeneficiaries();
  }

  buscar(): void {
    const texto = this.searchForm.get('searchText')?.value?.trim().toUpperCase() ?? '';
    const base = !texto ? this.todosLosRegistros : this.todosLosRegistros.filter(r =>
      r.nombreEmpleado?.toUpperCase().includes(texto) ||
      r.rfcEmpleado?.toUpperCase().includes(texto)    ||
      r.nombreCompleto?.toUpperCase().includes(texto)
    );
    const seenEmployees = new Set<number>();
    this.dataSource.data = base.map(r => ({
      ...r,
      showEmpleado: !seenEmployees.has(r.tabEmpleadosId) && seenEmployees.add(r.tabEmpleadosId) !== null
    }));
  }

  loadBanks(): void {
    this.juiciosMercantilesService.getBancos().subscribe({
      next: (resp: any) => this.banco = resp?.data ?? [],
      error: () => console.error('Error al cargar bancos')
    });
  }

  loadBeneficiaries(): void {
    this.juiciosMercantilesService.getTodosBeneficiarios().subscribe({
      next: (resp: any) => {
        const grupos: any[] = resp?.data ?? [];

        const sorted = grupos.flatMap((grupo: any) => {
          return (grupo.beneficiarios ?? []).map((b: any) => ({
            showEmpleado: false,
            nombreEmpleado: grupo.nombreCompleto,
            rfcEmpleado: b?.rfc ?? '',
            nombreCompleto: `${b?.primerApellido ?? ''} ${b?.segundoApellido ?? ''} ${b?.nombre ?? ''}`.trim(),
            primerApellido: b?.primerApellido ?? '',
            segundoApellido: b?.segundoApellido ?? '',
            nombre: b?.nombre ?? '',
            rfc: b?.rfc ?? '',
            importeTotal: Number(b?.importeTotal ?? 0),
            factorImporte: Number(b?.factorImporte ?? 0),
            qnaini: Number(b?.qnaini ?? 0),
            qnafin: b?.qnafin ? Number(b.qnafin) : null,
            status: b?.estatus ?? b?.status ?? 'ACTIVO',
            numeroDocumento: b?.numeroDocumento ?? '',
            formaAplicacion: b?.formaAplicacion ?? '',
            tabEmpleadosId: grupo.empleadoId,
            id: b?.id,
            tabBeneficiariosJmId: b?.tabBeneficiariosJmId ?? null,
            tabBeneficiario: b?.tabBeneficiario ?? null
          }));
        })
        .sort((a: any, b: any) => {
          if (a.tabEmpleadosId !== b.tabEmpleadosId) return a.tabEmpleadosId - b.tabEmpleadosId;
          return a.id - b.id;
        });

        // Recalcula showEmpleado después del sort
        const seenEmployees = new Set<number>();
        sorted.forEach((row: any) => {
          row.showEmpleado = !seenEmployees.has(row.tabEmpleadosId);
          seenEmployees.add(row.tabEmpleadosId);
        });

        this.todosLosRegistros = sorted;
        this.zone.runOutsideAngular(() => {
          this.dataSource.data = sorted;
          this.hasCheck = true;
          setTimeout(() => {
            this.zone.run(() => {
              this.dataSource.paginator = this.paginator;
              this.cd.markForCheck();
            });
          });
        });
      },
      error: () => console.error('Error al cargar beneficiarios')
    });
  }

  openEditDialog(row: any): void {
    const dialogRef = this.dialog.open(AltaBeneficiarioJmDialog, {
      width: '1200px',
      maxWidth: '92vw',
      maxHeight: '90vh',
      panelClass: 'jm-dialog-panel',
      data: {
        empleadoId: row.tabEmpleadosId,
        bancos: this.banco,
        modo: 'editar',
        beneficiario: row
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      this.loadBeneficiaries();
    });
  }

  limpiar(): void {
    this.searchForm.reset();
    const seenEmployees = new Set<number>();
    this.dataSource.data = this.todosLosRegistros.map(r => ({
      ...r,
      showEmpleado: !seenEmployees.has(r.tabEmpleadosId) && seenEmployees.add(r.tabEmpleadosId) !== null
    }));
  }
}

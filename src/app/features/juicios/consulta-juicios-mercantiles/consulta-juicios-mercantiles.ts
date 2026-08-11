import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { JuiciosMercantilesService } from '../../../core/services/juicios-mercantiles.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { UppercaseDirective } from '../../../shared/directives/upperCase.directivas';
import { AltaBeneficiarioJmDialog } from '../../../shared/dialogs/alta-beneficiario-jm-dialog/alta-beneficiario-jm-dialog';
import { MatDialog } from '@angular/material/dialog';
import { LoaderService } from '../../../core/services/loader.service';
import { finalize } from 'rxjs';
import { MatSelectModule } from '@angular/material/select';
import { DateYearsHelper } from '../../../shared/helpers/date-years.helper';
import { ToastService } from '../../../core/services/toast.service';

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
    MatSelectModule,
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
  private readonly dialog = inject(MatDialog); 
  private readonly loaderService = inject(LoaderService);
  private readonly toastService = inject(ToastService);

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

  anios: number[] = [];
  quincenas: number[] = [];

  readonly estados = [
    { value: 'TODOS', label: 'Todos' },
    { value: 'ACTIVOS', label: 'Activos' },
    { value: 'FINALIZADOS', label: 'Finalizados'}
  ]
   

  private todosLosRegistros: any[] = [];

  searchForm = new FormGroup({
    searchText: new FormControl(''),
    busqueda: new FormGroup({
      anio: new FormControl<number | null>(null),
      quincena: new FormControl<number | null>(null),
      estado: new FormControl('TODOS')
    })
  });

   ngOnInit(): void {
    this.anios = DateYearsHelper.getYears(1,1);
    this.quincenas = DateYearsHelper.getQna();
    this.loadBanks();
    this.loadBeneficiaries();
    this.searchForm.get('busqueda')?.valueChanges.subscribe(() => {
      this.loaderService.show();
      setTimeout(() => {
          this.applyFilters(this.todosLosRegistros);
        this.loaderService.hide();
      }, 200);
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  buscar(): void {
    const texto = this.searchForm.get('searchText')?.value?.trim().toUpperCase() ?? '';
    if (texto.length < 3) {
      this.toastService.warning('Búsqueda requerida.', 'Captura al menos 3 caracteres para buscar.',  4000);
      return;
    }
    let filtrados = this.todosLosRegistros;
    filtrados = filtrados.filter(r =>
      r.nombreEmpleado?.toUpperCase().includes(texto) ||
      r.rfcEmpleado?.toUpperCase().includes(texto) ||
      r.nombreCompleto?.toUpperCase().includes(texto)
    );
    this.applyFilters(filtrados);
  }

  applyFilters(base: any[]): void {
    const anio = this.searchForm.get('busqueda.anio')?.value;
    const quincena = this.searchForm.get('busqueda.quincena')?.value;
    const estado = this.searchForm.get('busqueda.estado')?.value;
    let filtrados = [...base];
      if(anio && quincena) {
        const qnaSeleccionada = Number(`${anio}${String(quincena).padStart(2, '0')}`);
        filtrados = filtrados.filter(r => r.qnaini === qnaSeleccionada);
      }
      if (estado === 'ACTIVOS') {
        filtrados = filtrados.filter(r => r.status !== 'INACTIVO');
      }

      if (estado === 'FINALIZADOS') {
        filtrados = filtrados.filter(r => r.status === 'INACTIVO');
      }
    this.updateTable(filtrados);
  }


  updateTable(registros: any[]): void {
    const empleadosMostrados = new Set<number>();
    this.dataSource.data = registros.map(r => {
        const mostrar = !empleadosMostrados.has(r.tabEmpleadosId);
        if (mostrar) {
            empleadosMostrados.add(r.tabEmpleadosId);
        }
        return {
            ...r,
            showEmpleado: mostrar
        };
    });
    this.dataSource.paginator = this.paginator;
    this.totalElements = registros.length;
    this.paginator?.firstPage();
  }

  loadBanks(): void {
    this.juiciosMercantilesService.getBancos().subscribe({
      next: (resp: any) => this.banco = resp?.data ?? [],
      error: () => {
        this.toastService.error('Error', 'Error al cargar bancos', 4000)
      }
    });
  }

  loadBeneficiaries(): void {
    this.loaderService.show();
    this.juiciosMercantilesService.getTodosBeneficiarios()
      .pipe(finalize(() => this.loaderService.hide()))
      .subscribe({
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

        this.todosLosRegistros = sorted;
        this.updateTable(sorted);
        this.hasCheck = true;
        this.cd.markForCheck();
        },
        error: () => {
          this.toastService.error('Error', 'Error al cargar beneficiarios', 4000)
        }
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
    this.searchForm.reset({
      searchText: '',
      busqueda: {
        anio: null,
        quincena: null,
        estado: 'TODOS'
      }
    });
    this.updateTable(this.todosLosRegistros);
  }
}

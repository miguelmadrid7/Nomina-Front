import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { FilaBeneficiario } from '../../../models/filabeneficiario.model';
import { BeneficiarioDTO } from '../../../models/dto/beneficiarioDTO.model';
import { PensionAlimenticiaService } from '../../../core/services/pension-alimenticia.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { UppercaseDirective } from '../../../shared/directives/upperCase.directivas';
import { MatDialog } from '@angular/material/dialog';
import { ConsultaPensionesDialog } from '../../../shared/dialogs/consulta-pensiones-dialog/consulta-pensiones-dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ConfirmDialog } from '../../../shared/dialogs/confirm-dialog/confirm-dialog';
import { LoaderService } from '../../../core/services/loader.service';
import { finalize } from 'rxjs';
import { DateYearsHelper } from '../../../shared/helpers/date-years.helper';

@Component({
  selector: 'app-pension-alimenticia-consulta',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSnackBarModule,
    MatTooltipModule,
    UppercaseDirective
  ],
  templateUrl: './pension-alimenticia-consulta.html',
  styleUrl: './pension-alimenticia-consulta.css'
})
export class PensionAlimenticiaConsulta implements OnInit, OnDestroy {

  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly pensionAlimenticiaService = inject(PensionAlimenticiaService);
  private readonly loaderService = inject(LoaderService);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  readonly displayedColumns: string[] = [
    'nombreEmpleado', 
    'rfcEmpleado', 
    'nombreBeneficiario', 
    'rfcReferencia', 
    'noBeneficiario', 
    'numeroOficio', 
    'qna', 
    'estado', 
    'acciones'
  ];
  dataSource = new MatTableDataSource<FilaBeneficiario>([]);
  todosLosBeneficiarios: FilaBeneficiario[] = [];
  totalElements = 0;
  cargando = false;
  empleadosFiltrados: string[] = [];

  anios: number[] = [];
  quincenas: number[] = [];

  readonly form = this.fb.group({
    busqueda: this.fb.group({         
      anio: [null],
      quincena: [null],
      estado: ['TODOS']
    }),
    nombreEmpleado: ['']                     
  });

  readonly estados = [
    { value: 'TODOS', label: 'Todos' },
    { value: 'ACTIVOS', label: 'Activos' },
    { value: 'FINALIZADOS', label: 'Finalizados'}
  ]
    
  ngOnInit(): void {
    this.anios = DateYearsHelper.getYears(1,1);
    this.quincenas = DateYearsHelper.getQna();
    this.cargarBeneficiarios();
    this.form.get('busqueda')?.valueChanges.subscribe(() => {
      this.loaderService.show();
        setTimeout(() => {
          this.buscar();
          this.loaderService.hide();
        }, 200);
    })
  }
     
  ngOnDestroy () {
    this.dialog.closeAll();
  }

  buscar(): void {
    const textoEmpleado = this.form.get('nombreEmpleado')?.value?.toString().trim().toUpperCase();
    let filtrados = this.todosLosBeneficiarios;
    if (textoEmpleado) {
      filtrados = filtrados.filter(b =>
        b.nombreEmpleado?.toUpperCase().includes(textoEmpleado) ||
        b.rfcEmpleado?.toUpperCase().includes(textoEmpleado)
      );
    }
    this.applyFilters(filtrados);
  }

  private applyFilters(base: FilaBeneficiario[]): void {
    const anio = this.form.get('busqueda.anio')?.value;
    const quincena = this.form.get('busqueda.quincena')?.value;
    const estado = this.form.get('busqueda.estado')?.value;

    let filtrados = [...base];

      if (anio && quincena) {
        const qnaSeleccionada = Number(`${anio}${String(quincena).padStart(2, '0')}`);
        filtrados = filtrados.filter(b => 
          b.qnaIni === qnaSeleccionada
        );
      }

      if(estado === 'ACTIVOS') {
        filtrados = filtrados.filter(b => 
          b.estatus === 'VIGENTE'
        );
      }

      if(estado === 'FINALIZADOS') { 
        filtrados = filtrados.filter(b =>
          b.estatus ==='FINALIZADO' || b.estatus === 'CANCELADO'
        );
      }
    this.actualizarTabla(filtrados);
  }

  private actualizarTabla(filas: FilaBeneficiario[]): void {
    const empleadosMostrados = new Set<string>();
    const filasConAgrupado = filas.map(fila => {
      if (!empleadosMostrados.has(fila.nombreEmpleado)) {
        empleadosMostrados.add(fila.nombreEmpleado);
        return { ...fila, mostrarEmpleado: true };
      }
      return { ...fila, mostrarEmpleado: false };
    });
    this.dataSource.data = filasConAgrupado;
    this.dataSource.paginator = this.paginator;
    this.totalElements = filasConAgrupado.length;
    this.paginator?.firstPage();
  }

  cargarBeneficiarios(): void {
    this.cargando = true;
    this.loaderService.show();

    this.pensionAlimenticiaService.getAllBeneficiarios()
      .pipe(finalize(() => {
        this.loaderService.hide();
        this.cargando = false;
      }))
      .subscribe({
        next: (resp) => {
          const datos: BeneficiarioDTO[] = resp?.data ?? [];
          this.todosLosBeneficiarios = datos.map(b => this.mapearFila(b));
          this.buscar();
        },
        error: () => {
          this.snackBar.open('Error al cargar beneficiarios', 'Cerrar', { duration: 4000 });
        }
      });
  }

  abrirDialog(fila: FilaBeneficiario): void {
    const dialogRef = this.dialog.open(ConsultaPensionesDialog, {
      width: '1200px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      autoFocus: false,
      disableClose: true,
      data: fila
    });
    dialogRef.afterClosed().subscribe((resp: boolean) => {
      if (resp) this.cargarBeneficiarios();
    });
  }

  eliminarBeneficiario(fila: FilaBeneficiario): void {
    const dialogRef = this.dialog.open(ConfirmDialog, {
      width: '420px',
      maxWidth: '95vw',
      disableClose: true,
      data: {
        type: 'danger',
        title: 'Eliminar beneficiario',
        message: `¿Estás seguro de eliminar la relación de pensión alimenticia de ${fila.nombreBeneficiario}?`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
      }
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.pensionAlimenticiaService.deleteBeneficiario(fila.id).subscribe({
        next: () => {
          this.snackBar.open('Beneficiario eliminado correctamente', 'Cerrar', { duration: 4000 });
          this.cargarBeneficiarios();
        },
        error: () => {
          this.snackBar.open('Error al eliminar el beneficiario', 'Cerrar', { duration: 4000 });
        }
      });
    });
  }

  clearFilters(): void {
    this.form.reset({ 
      busqueda: { 
        anio: null, 
        quincena: null,
        estado: 'TODOS'
      },
      nombreEmpleado: ''
    });
    this.actualizarTabla(this.todosLosBeneficiarios);
  }

  private mapearFila(b: BeneficiarioDTO): FilaBeneficiario {
    const alim = b.beneficiarioAlim;
    const emp  = b.empleado;
      return {
        id: b.id,
        tabBeneficiariosAlimId: b.tabBeneficiariosAlimId,
        nombreEmpleado: emp ? [emp.primerApellido, emp.segundoApellido, emp.nombre].filter(Boolean).join(' '): 'SIN EMPLEADO',
        rfcEmpleado: emp?.rfc ?? '—',
        nombreBeneficiario: alim ? [alim.primerApellido, alim.segundoApellido, alim.nombre].filter(Boolean).join(' ')  : `ID ${b.tabBeneficiariosAlimId}`,
        rfcReferencia: alim?.rfc ?? '—',
        numeroOficio: b.numeroOficio ?? '—',
        noBeneficiario: b.numeroBenef,
        formaAplicacion: b.formaAplicacion === 'P' ? 'Factor' : 'Importe fijo',
        factorImporte: b.formaAplicacion === 'P' ? `${(b.factorImporte * 100).toFixed(0)}%` : `$${b.factorImporte.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
        banco: b.banco?.banco ?? 'SIN BANCO',
        qna: `${b.qnaini} → ${b.qnafin === 999999 ? 'Indefinido' : (b.qnafin ?? '—')}`,
        qnaIni: b.qnaini,   
        qnaFin: b.qnafin,   
        mostrarEmpleado: false,
        estatus: (!b.qnafin || b.qnafin === 999999) ? 'VIGENTE' : 'FINALIZADO'
        
      };
  }
}
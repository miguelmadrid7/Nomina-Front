import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ApiResponse } from '../../../models/api-Response.model';
import { BeneficiarioDTO, FilaBeneficiario } from '../../../models/beneficiario.model';
import { PensionAlimenticiaService } from '../../../core/services/pension-alimenticia.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { UppercaseDirective } from '../../../shared/directives/upperCase.directivas';
import { MatDialog } from '@angular/material/dialog';
import { ConsultaPensionesDialog } from '../../../shared/dialogs/consulta-pensiones-dialog/consulta-pensiones-dialog';
import { MatSelectModule } from '@angular/material/select';

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
    UppercaseDirective
  ],
  templateUrl: './pension-alimenticia-consulta.html',
  styleUrl: './pension-alimenticia-consulta.css'
})
export class PensionAlimenticiaConsulta implements OnInit, AfterViewInit {

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  displayedColumns: string[] = ['nombreEmpleado', 'rfcEmpleado', 'nombreBeneficiario', 'rfcReferencia', 'noBeneficiario', 'numeroOficio', 'qna', 'acciones'];
  dataSource = new MatTableDataSource<FilaBeneficiario>([]);
  todosLosBeneficiarios: FilaBeneficiario[] = [];

  form!: FormGroup;
  totalElements = 0;
  cargando = false;

  anios: number[] = [2026, 2025, 2024];
  quincenas: number[] = Array.from({ length: 24 }, (_, i) => i + 1);

  constructor(
    private pensionAlimenticiaService: PensionAlimenticiaService,
    private fb: FormBuilder,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      busqueda: this.fb.group({         
        anio:     [null],
        quincena: [null]
      }),
      rfcEmpleado: [''],
      rfcReferencia: [''],
      nombreBeneficiario: [''], 
      nombreEmpleado: ['']                     
    });

    this.cargarBeneficiarios();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }


  // En buscar() agrega el filtro:
  buscar(): void {
    const textoBusqueda = this.form.get('rfcEmpleado')?.value?.toString().trim().toUpperCase();
    const textoReferencia = this.form.get('rfcReferencia')?.value?.toString().trim().toUpperCase();
    const textoBeneficiario = this.form.get('nombreBeneficiario')?.value?.toString().trim().toUpperCase();
    const textoEmpleado = this.form.get('nombreEmpleado')?.value?.toString().trim().toUpperCase();

    let filtrados = this.todosLosBeneficiarios;

    if (textoBusqueda) {
      filtrados = filtrados.filter(b =>
        b.nombreEmpleado?.toUpperCase().includes(textoBusqueda) ||
        b.rfcEmpleado?.toUpperCase().includes(textoBusqueda)
      );
    }

    if (textoReferencia) {
      filtrados = filtrados.filter(b =>
        b.rfcReferencia?.toUpperCase().includes(textoReferencia)
      );
    }

    if (textoEmpleado) {
      filtrados = filtrados.filter(b =>
        b.nombreEmpleado?.toUpperCase().includes(textoEmpleado)
      );
    }

    if (textoBeneficiario) {                                        
      filtrados = filtrados.filter(b =>
        b.nombreBeneficiario?.toUpperCase().includes(textoBeneficiario)
      );
    }
    this.aplicarFiltroQna(filtrados);
  }


  private aplicarFiltroQna(base: FilaBeneficiario[]): void {
    const anio     = this.form.get('busqueda.anio')?.value;
    const quincena = this.form.get('busqueda.quincena')?.value;
    if (!anio || !quincena) {
      this.actualizarTabla(base);
      return;
    }
    const qnaSeleccionada = Number(`${anio}${String(quincena).padStart(2, '0')}`);
    const filtrados = base.filter(b => {
      return b.qnaIni === qnaSeleccionada;
    });

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
    this.totalElements   = filasConAgrupado.length;
    this.paginator?.firstPage();
  }

  cargarBeneficiarios(): void {
    this.cargando = true;
    this.pensionAlimenticiaService.getAllBeneficiarios().subscribe({
      next: (resp: ApiResponse<BeneficiarioDTO[]>) => {
        const datos = resp?.data ?? [];

        datos.sort((a, b) => {
          const na = `${a.empleado?.primerApellido ?? ''} ${a.empleado?.segundoApellido ?? ''} ${a.empleado?.nombre ?? ''}`;
          const nb = `${b.empleado?.primerApellido ?? ''} ${b.empleado?.segundoApellido ?? ''} ${b.empleado?.nombre ?? ''}`;
          return na.localeCompare(nb);
        });

        this.todosLosBeneficiarios = datos.map(b => this.mapearFila(b));
        this.actualizarTabla(this.todosLosBeneficiarios);
        this.cargando = false;
      },
      error: (err: any) => {
        console.error('Error al cargar beneficiarios', err);
        this.cargando = false;
      }
    });
  }

  abrirDialog(fila: FilaBeneficiario): void {
    const dialogRef = this.dialog.open(ConsultaPensionesDialog, {
      width: '1200px',
      maxWidth: '92vw',
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
    console.log('ID a eliminar:', fila.id);
    
    if (!confirm(`¿Estás seguro de eliminar la relación de pensión alimenticia?`)) {
      return;
    }

    this.pensionAlimenticiaService.deleteBeneficiario(fila.id).subscribe({
      next: () => {
        this.cargarBeneficiarios();
      },
      error: (err: any) => {
        console.error('Error al eliminar', err);
        alert('Error al eliminar');
      }
    });
  }

  clearFilters(): void {
    this.form.reset({ 
      busqueda: { 
        anio: null, 
        quincena: null 
      }, rfcReferencia: '' 
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
      qna: `${b.qnaini} → ${b.qnafin}`,
      qnaIni: b.qnaini,   
      qnaFin: b.qnafin,   
      mostrarEmpleado: false
    };
  }
}
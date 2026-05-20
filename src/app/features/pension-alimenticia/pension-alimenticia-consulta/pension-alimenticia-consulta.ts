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

  displayedColumns: string[] = ['nombreEmpleado', 'nombreBeneficiario', 'rfc', 'noBeneficiario', 'qna', 'acciones'];
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
      busqueda: this.fb.group({         // ✅ grupo anidado para los selects de QNA
        anio:     [null],
        quincena: [null]
      }),
      rfc: ['']                         // ✅ filtro de nombre en el header de la tabla
    });

    this.cargarBeneficiarios();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  // ─── Filtro por nombre en la cabecera de la tabla ──────────────────
  buscar(): void {
    const texto = this.form.get('rfc')?.value?.toString().trim().toUpperCase();
    const filtrados = texto
      ? this.todosLosBeneficiarios.filter(b =>
          b.nombreEmpleado?.toUpperCase().includes(texto)
        )
      : this.todosLosBeneficiarios;

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
    // ✅ Solo registros que iniciaron EXACTAMENTE en la QNA seleccionada
    return b.qnaIni === qnaSeleccionada;
  });

  this.actualizarTabla(filtrados);
}

  private actualizarTabla(filas: FilaBeneficiario[]): void {
    // Recalcula mostrarEmpleado para el agrupado visual
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

  // ─── Carga inicial ─────────────────────────────────────────────────
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
      data: fila.id
    });
    dialogRef.afterClosed().subscribe((resp: boolean) => {
      if (resp) this.cargarBeneficiarios();
    });
  }

  clearFilters(): void {
    this.form.reset({ busqueda: { anio: null, quincena: null }, rfc: '' });
    this.actualizarTabla(this.todosLosBeneficiarios);
  }

  private mapearFila(b: BeneficiarioDTO): FilaBeneficiario {
    const alim = b.beneficiarioAlim;
    const emp  = b.empleado;

    return {
      id:                 b.id,
      nombreEmpleado:     emp
                            ? [emp.primerApellido, emp.segundoApellido, emp.nombre].filter(Boolean).join(' ')
                            : 'SIN EMPLEADO',
      nombreBeneficiario: alim
                            ? [alim.primerApellido, alim.segundoApellido, alim.nombre].filter(Boolean).join(' ')
                            : `ID ${b.tabBeneficiariosAlimId}`,
      rfc:                alim?.rfc ?? '—',
      noBeneficiario:     b.numeroBenef,
      formaAplicacion:    b.formaAplicacion === 'P' ? 'Factor' : 'Importe fijo',
      factorImporte:      b.formaAplicacion === 'P'
                            ? `${(b.factorImporte * 100).toFixed(0)}%`
                            : `$${b.factorImporte.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      banco:              b.banco?.banco ?? 'SIN BANCO',
      qna:                `${b.qnaini} → ${b.qnafin}`,
      qnaIni:             b.qnaini,   // ✅ número raw para el filtro
      qnaFin:             b.qnafin,   // ✅ número raw para el filtro
      mostrarEmpleado:    false
    };
  }
}
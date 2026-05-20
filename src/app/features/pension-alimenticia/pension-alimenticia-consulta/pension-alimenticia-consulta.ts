import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ApiResponse } from '../../../models/api-Response.model';
import { BeneficiarioDTO, FilaBeneficiario } from '../../../models/beneficiario.model';
import { PensionAlimenticiaService } from '../../../core/services/pension-alimenticia.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { UppercaseDirective } from "../../../shared/directives/upperCase.directivas";

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
  filtrosTabla!: FormGroup;
  totalElements = 0;
  pageIndex = 0;
  pageSize = 50;
  cargando = false;

  constructor(private pensionAlimenticiaService: PensionAlimenticiaService, private fb: FormBuilder) {}


  ngOnInit(): void {
    this.form = this.fb.group({
      rfc: ['']
    }),

    this.cargarBeneficiarios();
  }

  ngAfterViewInit(): void {
   this.dataSource.paginator = this.paginator;
  }

  buscar(): void {
    const texto = this.form.get('rfc')?.value?.toString().trim().toUpperCase();
      if (!texto) {
        this.dataSource.data = this.todosLosBeneficiarios;
        this.totalElements = this.todosLosBeneficiarios.length;
        this.paginator?.firstPage();
        return;
      }
    const filtrados = this.todosLosBeneficiarios.filter(b =>
      b.nombreEmpleado?.toUpperCase().includes(texto)
    );
      this.dataSource.data = filtrados;
      this.totalElements = filtrados.length;
      this.paginator?.firstPage();
  }

  cargarBeneficiarios(): void {
    this.cargando = true;
    this.pensionAlimenticiaService.getAllBeneficiarios().subscribe({
      next: (resp: ApiResponse<BeneficiarioDTO[]>) => {
        const datos = resp?.data ?? [];
        datos.sort((a, b) => {
          const nombreA = `${a.empleado?.primerApellido ?? ''} ${a.empleado?.segundoApellido ?? ''} ${a.empleado?.nombre ?? ''}`;
          const nombreB =`${b.empleado?.primerApellido ?? ''} ${b.empleado?.segundoApellido ?? ''} ${b.empleado?.nombre ?? ''}`;
          return nombreA.localeCompare(nombreB);
        });
        const filasMapeadas = datos.map(b => this.mapearFila(b));
        const empleadosMostrados = new Set<string>();
        const filas = filasMapeadas.map(fila => {
          if (!empleadosMostrados.has(fila.nombreEmpleado)) {
            empleadosMostrados.add(fila.nombreEmpleado);
              return {
                ...fila,
                mostrarEmpleado: true
              };
          }

          return {
            ...fila,
            mostrarEmpleado: false
          };
        });
        this.totalElements = filas.length;
        this.todosLosBeneficiarios = filas;
        this.dataSource.data = filas;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar beneficiarios', err);
        this.cargando = false;
      }
    });
  }

  clearFilters(): void {
    this.form.reset({
      rfc: ''
    });
    this.dataSource.data = this.todosLosBeneficiarios;
    this.totalElements = this.todosLosBeneficiarios.length;
    this.pageIndex = 0;
    this.paginator?.firstPage();
  }

  private mapearFila(b: BeneficiarioDTO): FilaBeneficiario {
  const alim = b.beneficiarioAlim;
  const nombreBeneficiario = alim
    ? [alim.primerApellido, alim.segundoApellido, alim.nombre]
        .filter(Boolean)
        .join(' ')
    : `ID ${b.tabBeneficiariosAlimId}`;
  const emp = b.empleado;
  const nombreEmpleado = emp
    ? [
        emp.primerApellido,
        emp.segundoApellido,
        emp.nombre
      ]
        .filter(Boolean)
        .join(' ')
    : 'SIN EMPLEADO';
  const rfc = alim?.rfc ?? '—';
  const formaAplicacion =  b.formaAplicacion === 'P'
      ? 'Factor'
      : 'Importe fijo';
  const factorImporte = b.formaAplicacion === 'P'
      ? `${(b.factorImporte * 100).toFixed(0)}%`
      : `$${b.factorImporte.toLocaleString('es-MX', {
          minimumFractionDigits: 2
        })}`;
  const qna = `${b.qnaini} → ${b.qnafin}`;
  return {
    id: b.id,
    nombreEmpleado,
    nombreBeneficiario,
    rfc,
    noBeneficiario: b.numeroBenef,
    formaAplicacion,
    factorImporte,
    banco: b.banco?.banco ?? 'SIN BANCO',
    qna,
  };
  }
}

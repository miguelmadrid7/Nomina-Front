import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, DestroyRef, inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { catchError, forkJoin, map, of } from 'rxjs';
import { CalendarioService } from '../../../core/services/calendario.service';
import { Calendario } from '../../../core/model/calendario.model';
import { ToastService } from '../../../core/services/toast.service';
import { formatEmployeeDisplay } from '../../../shared/helpers/empelado.helper';
import { EmployeeService } from '../../../core/services/employee.service';
import { UppercaseDirective } from '../../../shared/directives/upperCase.directivas';
import { IncidenciasInasistenciasService } from '../../../core/services/incidencias-inasistencias.service';
import { IncidenciasInasistenciasRequest } from '../../../core/model/request/iniasistencias-request.model';
import { PlazaEmpleado } from '../../../core/model/incidencias-inasistencias/plaza-empleado.model';
import { EmpleadoWithPlaza } from '../../../core/model/empleado-with-plaza.model';
import { TipoInasistencia } from '../../../core/model/incidencias-inasistencias/tipo-inasistencia.model';
import { FilaFalta } from '../../../core/model/incidencias-inasistencias/fila-falta.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DateYearsHelper } from '../../../shared/helpers/date-years.helper';
import { qnaFormatValidator } from '../../../shared/validators/form.validator';

/** Falta capturada que todavía no se guarda en la BD: la fila + su plaza. */
type FaltaPendiente = FilaFalta & { plaza: PlazaEmpleado };

@Component({
  selector: 'app-inasistencias-incidencias',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule,
    MatTooltipModule,
    MatTableModule,
    MatPaginatorModule,
    MatDatepickerModule,
    UppercaseDirective,
  ],
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'es-MX' },
  ],
  templateUrl: './inasistencias-incidencias.html',
  styleUrl: './inasistencias-incidencias.css'
})
export class InasistenciasIncidencias implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatAutocompleteTrigger) autocompleteTrigger?: MatAutocompleteTrigger;

  private readonly calendarioService = inject(CalendarioService);
  private readonly employeeService = inject(EmployeeService);
  private readonly inasistenciasService = inject(IncidenciasInasistenciasService);
  private readonly toastService = inject(ToastService);
  private readonly cd = inject(ChangeDetectorRef);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  calendarioActual: Calendario | null = null;
  cargandoQna = false;
  errorQna = false;
  resultados: EmpleadoWithPlaza[] = [];
  cargandoBusqueda = false;
  empleadoId: number | null = null;
  empleadoSeleccionado: EmpleadoWithPlaza | null = null;
  plazas: PlazaEmpleado[] = [];
  plazaSeleccionada: PlazaEmpleado | null = null;
  dateToday = new Date();
  totalDescuento = 0;
  faltasPendientes: FaltaPendiente[] = [];
  gruposPendientes: { plaza: PlazaEmpleado; faltas: FaltaPendiente[] }[] = [];
  guardandoTodo = false;
  filasPorPlaza = new Map<number, FilaFalta[]>();
  tipoInasistenciaDefault = 'N';

  dataSource = new MatTableDataSource<FilaFalta>([]);
  readonly displayedColumns: string[] = ['folio', 'fechaCaptura', 'qna', 'tipo', 'dia', 'horas', 'importe', 'acciones'];
  readonly pendientesColumns: string[] = ['folio', 'fechaCaptura', 'qna', 'tipo', 'dia', 'horas', 'importe', 'quitar'];
  readonly displayFn = (emp: EmpleadoWithPlaza | string | null): string => formatEmployeeDisplay(emp);
  
  readonly form: FormGroup = this.fb.group({
    searchText: [''],
  });

  readonly tiposInasistencia: TipoInasistencia[] = [
    { value: 'N', label: 'Normal' },
    { value: 'A', label: 'Adición' },
    { value: 'D', label: 'Devolución' },
  ];

  get qnaProceso(): number | null {
    if (!this.calendarioActual) return null;
    return DateYearsHelper.toQnaCode(this.calendarioActual.ejercicio, this.calendarioActual.qna);
  }

  ngOnInit(): void {
    this.loadQnaActivated();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  loadQnaActivated(): void {
    this.cargandoQna = true;
    this.errorQna = false;
    this.calendarioService.getQnaActiva().subscribe({
      next: (resp) => {
        this.calendarioActual = resp?.data ?? null;
        this.cargandoQna = false;
        this.errorQna = !this.calendarioActual;
        this.cd.markForCheck();
      },
      error: () => {
        this.calendarioActual = null;
        this.cargandoQna = false;
        this.errorQna = true;
        this.cd.markForCheck();
      }
    });
  }

  onSearchInputChange(): void {
    const searchValue = this.form.get('searchText')?.value || '';
    if (!searchValue || searchValue.trim().length === 0) {
      this.resultados = [];
      this.autocompleteTrigger?.closePanel();
      this.empleadoId = null;
    }
  }

  searchEmployee(): void {
    const q = (this.form.get('searchText')?.value || '').trim().toUpperCase();
    if (!q) {
      this.resultados = [];
      return;
    }
    if (q.length < 3) {
      this.resultados = [];
      this.toastService.warning('Búsqueda inválida', 'Captura al menos 3 caracteres para buscar.', 4000);
      return;
    }
    this.cargandoBusqueda = true;
    this.employeeService.searchEmpleadosConPlazas(q).subscribe({
      next: (resp) => {
        this.resultados = resp?.data ?? [];
        this.cargandoBusqueda = false;
        this.cd.detectChanges();
        setTimeout(() => {
          if (!this.autocompleteTrigger) return;
          if (this.resultados.length > 0) {
            this.autocompleteTrigger.openPanel();
          } else {
            this.autocompleteTrigger.closePanel();
          }
        });
      },
      error: () => {
        this.resultados = [];
        this.cargandoBusqueda = false;
        this.autocompleteTrigger?.closePanel();
        this.cd.detectChanges();
      }
    });
  }

  onOptionSelected(emp: EmpleadoWithPlaza): void {
    this.selectEmployee(emp);
    this.form.get('searchText')?.setValue(formatEmployeeDisplay(emp));
  }

  selectEmployee(emp: EmpleadoWithPlaza): void {
    this.resetSeleccion();
    if (!emp?.id) return;

    this.empleadoId = emp.id;
    this.empleadoSeleccionado = emp;
    this.plazas = emp.plazas ?? [];

    if (this.plazas.length === 0) {
      this.toastService.warning('Sin plazas', 'El trabajador no tiene plazas asignadas.', 4000);
    } else {
      this.selectPlaza(this.plazas[0]);
    }
    this.cd.markForCheck();
  }

  selectPlaza(plaza: PlazaEmpleado): void {
    this.plazaSeleccionada = plaza;
    if (!this.filasPorPlaza.has(plaza.id)) {
      this.filasPorPlaza.set(plaza.id, [this.buildFila(plaza)]);
    }
    this.refrescarTabla();
  }

  addRow(): void {
    if (!this.plazaSeleccionada) return;
    this.filasActuales().push(this.buildFila(this.plazaSeleccionada));
    this.refrescarTabla();
  }

  canRemoveRow(): boolean {
    return this.filasActuales().length > 1;
  }

  removeRow(fila: FilaFalta): void {
    const filas = this.filasActuales();
    filas.splice(filas.indexOf(fila), 1);
    this.refrescarTabla();
  }

  /** Texto de horas de la plaza: '1 hr', '4 hrs' o 'Jornada' si no tiene horas. */
  horasLabel(plaza: PlazaEmpleado): string {
    const horas = plaza.horas ?? 0;
    if (horas <= 0) return 'Jornada';
    return `${horas} ${horas === 1 ? 'hr' : 'hrs'}`;
  }

  tipoLabel(value: string): string {
    return this.tiposInasistencia.find(t => t.value === value)?.label ?? value;
  }

  /** ✓ de la fila: valida y pasa la falta a "Faltas por registrar". No llama al backend. */
 
  agregarAPendientes(fila: FilaFalta): void {
    const plaza = this.plazaSeleccionada;
    if (!plaza) return;

    const horasCtrl = fila.form.get('horasInasistencia');
    if (horasCtrl?.hasError('max')) {
      horasCtrl.markAsTouched();
      this.toastService.warning(
        'Horas excedidas',
        `La plaza tiene ${plaza.horas} ${plaza.horas === 1 ? 'hora' : 'horas'}; no puedes registrar más.`,
        4000
      );
      return;
    }
    if (fila.form.invalid) {
      fila.form.markAllAsTouched();
      this.toastService.warning('Datos incompletos', 'Captura número, quincena, tipo y día de la inasistencia.', 4000);
      return;
    }

    // Copia de la fila (ya con su importe calculado), para que se conserve aunque el formulario se limpie
    this.faltasPendientes.push({ plaza, form: this.fb.group(fila.form.getRawValue()) });
    this.refrescarPendientes();

    const filas = this.filasPorPlaza.get(plaza.id) ?? [];
    if (filas.length > 1) {
      filas.splice(filas.indexOf(fila), 1);
    } else {
      const horasIniciales = this.horasDefault(plaza);
      fila.form.reset({
        ...this.faltaDefaults(),
        horasInasistencia: horasIniciales,
        importeDescuento: this.calcularImporte(plaza, horasIniciales),
      });
    }
    this.refrescarTabla();
    this.cd.markForCheck();
  }

  quitarPendiente(pendiente: FaltaPendiente): void {
    this.faltasPendientes = this.faltasPendientes.filter(p => p !== pendiente);
    this.refrescarPendientes();
  }

  /** Botón final: guarda en la BD todas las faltas por registrar (un POST por falta). */
  registrarPendientes(): void {
    if (this.faltasPendientes.length === 0) return;
    if (!this.empleadoId || !this.calendarioActual || !this.qnaProceso) {
      this.toastService.warning('Registro no disponible', 'Verifica el trabajador y la quincena activa.', 4000);
      return;
    }

    const empleadoId = this.empleadoId;
    const ejercicio = this.calendarioActual.ejercicio;
    const qnaProceso = this.qnaProceso;
    const pendientes = [...this.faltasPendientes];

    const requests = pendientes.map(p =>
      this.inasistenciasService.addIncidencia(this.buildBody(p, empleadoId, ejercicio, qnaProceso)).pipe(
        map(resp => resp?.success === true),
        catchError(() => of(false))
      )
    );

    this.guardandoTodo = true;
    forkJoin(requests).subscribe(resultados => {
      this.guardandoTodo = false;

      // Se quedan en la lista solo las que fallaron
      this.faltasPendientes = pendientes.filter((_, i) => !resultados[i]);
      this.refrescarPendientes();

      const exitosas = resultados.filter(ok => ok).length;
      const fallidas = resultados.length - exitosas;

      if (fallidas === 0) {
        this.toastService.success('Faltas registradas', `${exitosas} ${exitosas === 1 ? 'falta registrada' : 'faltas registradas'}.`, 4000);
      } else if (exitosas === 0) {
        this.toastService.error('Error', 'No fue posible registrar las faltas.', 4000);
      } else {
        this.toastService.warning('Registro parcial', `${exitosas} registradas, ${fallidas} pendientes. Revisa las que quedaron.`, 5000);
      }
      this.cd.markForCheck();
    });
  }

  clearSearch(): void {
    this.form.reset({ searchText: '' });
    this.resultados = [];
    this.cargandoBusqueda = false;
    this.autocompleteTrigger?.closePanel();
    this.resetSeleccion();
  }

  private buildBody(p: FaltaPendiente, empleadoId: number, ejercicio: number, qnaProceso: number): IncidenciasInasistenciasRequest {
    const { folio, tipoInasistencia, horasInasistencia, importeDescuento  } = p.form.value;
    return {
      folio: Number(folio),
      ejercicio,
      qnaProceso,
      fechaInasistencia: DateYearsHelper.toIsoDate(new Date()),
      tipoInasistencia,
      horasInasistencia: Number(horasInasistencia) || 0,
      tabEmpleadosId: empleadoId,
      tabPlazasId: p.plaza.id,
      importe: Number(importeDescuento) || 0,
    };
  }

  /** Agrupa las pendientes por plaza, en el orden del selector; solo plazas con faltas. */
  private refrescarPendientes(): void {
    this.gruposPendientes = this.plazas
      .map(plaza => ({ plaza, faltas: this.faltasPendientes.filter(p => p.plaza.id === plaza.id) }))
      .filter(grupo => grupo.faltas.length > 0);
    this.totalDescuento = this.faltasPendientes
      .reduce((total, p) => total + (Number(p.form.value.importeDescuento) || 0), 0);
  }

  private filasActuales(): FilaFalta[] {
    if (!this.plazaSeleccionada) return [];
    return this.filasPorPlaza.get(this.plazaSeleccionada.id) ?? [];
  }

  private refrescarTabla(): void {
    this.dataSource.data = [...this.filasActuales()];
  }

  /** Plazas de jornada (tipo P): 1 por default y no se edita. */
  private horasDefault(plaza: PlazaEmpleado): number {
    return plaza.esPlazaJornada ? 1 : 0;
  }

  /** Hrs/día: mínimo 0 y, en plazas de horas, máximo las horas de la plaza. */
  private horasValidators(plaza: PlazaEmpleado) {
    const validators = [Validators.required, Validators.min(0)];
    const horasPlaza = plaza.horas ?? 0;
    if (horasPlaza > 0) {
      validators.push(Validators.max(horasPlaza));
    }
    return validators;
  }

  private buildFila(plaza: PlazaEmpleado): FilaFalta {
    const horasIniciales = this.horasDefault(plaza);
    const form = this.fb.group({
      folio: [null as number | null, [Validators.required, Validators.min(1)]],
      qnaInasistencia: ['', [Validators.required, qnaFormatValidator()]],
      tipoInasistencia: [this.tipoInasistenciaDefault, Validators.required],
      diaInasistencia: [null as Date | null, Validators.required],
      horasInasistencia: [horasIniciales, this.horasValidators(plaza)],
      importeDescuento: [this.calcularImporte(plaza, horasIniciales)],
    });
    form.get('horasInasistencia')!.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(horas => {
        form.get('importeDescuento')!.setValue(this.calcularImporte(plaza, horas ?? 0), { emitEvent: false });
      });

    return { form };
  }

  private calcularImporte(plaza: PlazaEmpleado, horas: number): number {
    const base = plaza.importeDescuento ?? 0;
    return Math.round(base * (Number(horas) || 0) * 100) / 100;
  }

  private faltaDefaults() {
    return {
      folio: null,
      qnaInasistencia: '',
      tipoInasistencia: this.tipoInasistenciaDefault,
      diaInasistencia: null,
      horasInasistencia: 0,
      importeDescuento: 0,
    };
  }

  private resetSeleccion(): void {
    this.empleadoId = null;
    this.empleadoSeleccionado = null;
    this.plazas = [];
    this.plazaSeleccionada = null;
    this.filasPorPlaza.clear();
    this.dataSource.data = [];
    this.faltasPendientes = [];
    this.gruposPendientes = [];
    this.guardandoTodo = false;
    this.totalDescuento = 0;
  }
}
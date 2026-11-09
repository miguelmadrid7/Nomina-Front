import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
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
    MatDatepickerModule,
    UppercaseDirective,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './inasistencias-incidencias.html',
  styleUrl: './inasistencias-incidencias.css'
})
export class InasistenciasIncidencias implements OnInit {
  @ViewChild(MatAutocompleteTrigger) autocompleteTrigger?: MatAutocompleteTrigger;

  private readonly calendarioService = inject(CalendarioService);
  private readonly employeeService = inject(EmployeeService);
  private readonly inasistenciasService = inject(IncidenciasInasistenciasService);
  private readonly toastService = inject(ToastService);
  private readonly cd = inject(ChangeDetectorRef);
  private readonly fb = inject(FormBuilder);

  calendarioActual: Calendario | null = null;
  cargandoQna = false;
  errorQna = false;
  resultados: EmpleadoWithPlaza[] = [];
  cargandoBusqueda = false;
  empleadoId: number | null = null;
  empleadoSeleccionado: EmpleadoWithPlaza | null = null;
  plazas: PlazaEmpleado[] = [];

  readonly faltasPorPlaza = new Map<number, FormArray<FormGroup>>();
  readonly guardandoIds = new Set<number>();
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
    return this.calendarioActual.ejercicio * 100 + this.calendarioActual.qna;
  }

  get qnaProcesoTexto(): string {
    return this.qnaProceso ? `${this.qnaProceso}` : 'No disponible';
  }

  ngOnInit(): void {
    this.loadQnaActivated();
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

    const plazas = emp.plazas ?? [];
    plazas.forEach(p => this.faltasPorPlaza.set(p.id, this.fb.array<FormGroup>([])));
    this.plazas = plazas;

    if (plazas.length === 0) {
      this.toastService.warning('Sin plazas', 'El trabajador no tiene plazas asignadas.', 4000);
    }
    this.cd.markForCheck();
  }

  getFaltas(plaza: PlazaEmpleado): FormArray<FormGroup> {
    let faltas = this.faltasPorPlaza.get(plaza.id);
    if (!faltas) {
      faltas = this.fb.array<FormGroup>([]);
      this.faltasPorPlaza.set(plaza.id, faltas);
    }
    return faltas;
  }

  agregarFalta(plaza: PlazaEmpleado): void {
    this.getFaltas(plaza).push(this.buildFaltaForm());
  }

  quitarFalta(plaza: PlazaEmpleado, index: number): void {
    this.getFaltas(plaza).removeAt(index);
  }

  isGuardando(plaza: PlazaEmpleado): boolean {
    return this.guardandoIds.has(plaza.id);
  }

  /** Quincena (yyyyQQ) a la que pertenece la fecha capturada en la fila. */
  getQnaInasistencia(falta: AbstractControl): string {
    const fecha: Date | null = falta.get('fechaInasistencia')?.value ?? null;
    return fecha ? `${this.qnaFromDate(fecha)}` : '';
  }

  registrarFaltas(plaza: PlazaEmpleado): void {
    const faltas = this.getFaltas(plaza);
    if (faltas.length === 0) return;

    if (faltas.invalid) {
      faltas.markAllAsTouched();
      this.toastService.warning('Datos incompletos', 'Captura folio, fecha y tipo en todas las faltas.', 4000);
      return;
    }
    if (!this.empleadoId || !this.calendarioActual || !this.qnaProceso) {
      this.toastService.warning('Registro no disponible', 'Verifica el trabajador y la quincena activa.', 4000);
      return;
    }

    const empleadoId = this.empleadoId;
    const ejercicio = this.calendarioActual.ejercicio;
    const qnaProceso = this.qnaProceso;

    const requests = faltas.controls.map(falta => {
      const { folio, fechaInasistencia, tipoInasistencia, horasInasistencia } = falta.value;
      const body: IncidenciasInasistenciasRequest = {
        folio: Number(folio),
        ejercicio,
        qnaProceso,
        fechaInasistencia: this.toIsoDate(fechaInasistencia),
        tipoInasistencia,
        horasInasistencia: Number(horasInasistencia) || 0,
        tabEmpleadosId: empleadoId,
        tabPlazasId: plaza.id,
      };
      return this.inasistenciasService.addIncidencia(body).pipe(
        map(resp => resp?.success === true),
        catchError(() => of(false))
      );
    });

    this.guardandoIds.add(plaza.id);
    forkJoin(requests).subscribe(resultados => {
      this.guardandoIds.delete(plaza.id);

      // Se quitan de atrás hacia adelante para no recorrer los índices.
      for (let i = resultados.length - 1; i >= 0; i--) {
        if (resultados[i]) faltas.removeAt(i);
      }

      const exitosas = resultados.filter(ok => ok).length;
      const fallidas = resultados.length - exitosas;

      if (fallidas === 0) {
        this.toastService.success('Faltas registradas', `${exitosas} en la plaza ${plaza.cvePlaza}`, 4000);
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

  private buildFaltaForm(): FormGroup {
    return this.fb.group({
      folio: [null as number | null, [Validators.required, Validators.min(1)]],
      fechaInasistencia: [null as Date | null, Validators.required],
      tipoInasistencia: ['', Validators.required],
      horasInasistencia: [0, [Validators.required, Validators.min(0)]],
    });
  }

  private resetSeleccion(): void {
    this.empleadoId = null;
    this.empleadoSeleccionado = null;
    this.plazas = [];
    this.faltasPorPlaza.clear();
    this.guardandoIds.clear();
  }

  /** Quincena yyyyQQ: del 1 al 15 es la impar del mes, del 16 en adelante la par. */
  private qnaFromDate(date: Date): number {
    const mes = date.getMonth() + 1;
    const qna = mes * 2 - (date.getDate() <= 15 ? 1 : 0);
    return date.getFullYear() * 100 + qna;
  }

  /** Convierte la fecha local a 'yyyy-MM-dd' sin desfase por zona horaria. */
  private toIsoDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Calendario } from '../../../core/model/calendario.model';
import { CalendarioService } from '../../../core/services/calendario.service';
import { IncidenciasInasistenciasService } from '../../../core/services/incidencias-inasistencias.service';
import { InasistenciasResponse } from '../../../core/model/response/incidencias-inasistencias/inasistencias-response.model';
import { DateYearsHelper } from '../../../shared/helpers/date-years.helper';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { qnaFormatValidator } from '../../../shared/validators/form.validator';
import { ToastService } from '../../../core/services/toast.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';

@Component({
  selector: 'app-consulta-inasistencias',
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
    MatDatepickerModule,
  ],
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'es-MX' },
  ],
  templateUrl: './consulta-inasistencias.html',
  styleUrl: './consulta-inasistencias.css'
})
export class ConsultaInasistencias implements OnInit {

  private readonly calendarioService = inject(CalendarioService);
  private readonly inasistenciasService = inject(IncidenciasInasistenciasService);
  private readonly toastService = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  private readonly changeDetectRef = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  calendarioActual: Calendario | null = null;
  cargandoQna = false;
  errorQna = false;
  todasLasFaltas: InasistenciasResponse[] = []; 
  faltasRegistradas: InasistenciasResponse[] = []; 
  cargandoRegistradas = false;
  totalElements = 0;
  pageSize = 10;
  pageIndex = 0;

  readonly displayedColumns: string[] = ['folio', 'empleado', 'plaza', 'dia', 'horas', 'importe'];
  readonly tiposInasistencia = [
    { value: 'N', label: 'Normal' },
    { value: 'A', label: 'Adición' },
    { value: 'D', label: 'Devolución' },
  ];
  readonly filtros = this.fb.group({
    qnaProceso: ['', qnaFormatValidator()],
    desde: [null as Date | null],
    hasta: [null as Date | null],
    tipo: [''],
  });

  get qnaProceso(): number | null {
    if (!this.calendarioActual) return null;
    return DateYearsHelper.toQnaCode(this.calendarioActual.ejercicio, this.calendarioActual.qna);
  }

  ngOnInit(): void {
    this.loadQnaActivated();
  }

  loadQnaActivated(): void {
    this.cargandoQna = true;
    this.errorQna = false;
    this.calendarioService.getQnaActiva()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resp) => {
          this.calendarioActual = resp?.data ?? null;
          this.cargandoQna = false;
          this.errorQna = !this.calendarioActual;
          this.filtros.patchValue({ qnaProceso: this.qnaProceso ? String(this.qnaProceso) : '' });
          this.buscar();     
          this.changeDetectRef.markForCheck();
        },
        error: () => {
          this.calendarioActual = null;
          this.cargandoQna = false;
          this.errorQna = true;
          this.changeDetectRef.markForCheck();
        }
      });
  }

  buscar(): void {
    console.log('buscar', this.filtros.getRawValue());
    if (this.filtros.invalid) {
      this.filtros.markAllAsTouched();
      this.toastService.warning('Filtros inválidos', 'Revisa el formato de la quincena (AAAAQQ).', 4000);
      return;
    }
    const { qnaProceso, desde, hasta, tipo } = this.filtros.getRawValue();
    if (desde && hasta && desde > hasta) {
      this.toastService.warning('Fechas inválidas', 'La fecha "Desde" no puede ser mayor que "Hasta".', 4000);
      return;
    }

    this.cargandoRegistradas = true;
    this.inasistenciasService.getIncidencias({
      qnaProceso: qnaProceso ? Number(qnaProceso) : undefined,
      desde: desde ? DateYearsHelper.toIsoDate(desde) : undefined,
      hasta: hasta ? DateYearsHelper.toIsoDate(hasta) : undefined,
      tipo: tipo || undefined,
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resp) => {
          this.todasLasFaltas = resp?.success ? (resp.data ?? []) : [];
          this.pageIndex = 0;
          this.refreshPage();
          this.cargandoRegistradas = false;
          this.changeDetectRef.markForCheck();
        },
        error: () => {
          this.todasLasFaltas = [];
          this.refreshPage();
          this.cargandoRegistradas = false;
          this.changeDetectRef.markForCheck();
        }
      });
  }

  limpiar(): void {
    this.filtros.reset({
      qnaProceso: this.qnaProceso ? String(this.qnaProceso) : '',
      desde: null,
      hasta: null,
      tipo: '',
    });
    this.buscar();
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.refreshPage();
  }

  private refreshPage(): void {
    this.totalElements = this.todasLasFaltas.length;
    const start = this.pageIndex * this.pageSize;
    this.faltasRegistradas = this.todasLasFaltas.slice(start, start + this.pageSize);
  }
}
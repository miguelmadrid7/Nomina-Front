import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { NominaRow } from '../../../models/nomina-Row.model';
import { CommonModule } from '@angular/common';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { TerceroService } from '../../../core/services/tercero.service';
import { LoaderService } from '../../../core/services/loader.service';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatRadioModule } from '@angular/material/radio';

@Component({
  selector: 'app-consulta-terceros',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatRadioModule
  ],
  templateUrl: './consulta-terceros.html',
  styleUrl: './consulta-terceros.css'
})
export class ConsultaTerceros {

  @ViewChild(MatPaginator) paginator?: MatPaginator;

  dataSource = new MatTableDataSource<NominaRow>([]);
  displayedColumns: string[] = [ 'rfc', 'curp', 'nombreCompleto', 'numeroOrden', 'tipoOrden', 'importeMensual', 'concepto', 'qnaProceso', 'estatus'];

  form!: FormGroup;
  filtrosTabla!: FormGroup;
  anio: number[] = [2026, 2025, 2024];
  quincena: number[] = Array.from({ length: 24 }, (_, i) => i + 1);
  conceptosInstitucionalesCodigos = ['03','08','12','55','56','64','vt','sf','5l','6l','21'];
  conceptosNoInstitucionalesCodigos = ['vp','53','61','cs','ce','fj','gf','51','57','ia','ic','im','iv','np','sg','bs','br','ef','ko','lb','oh','su','tc','tm','tn'];
  conceptosInstitucionales: any[] = [];
  conceptosNoInstitucionales: any[] = [];
  conceptosFiltrados: any[] = [];
  totalElements = 0;

  tipoOrdenOptions = [ { label: 'Alta', value: 1 }, { label: 'Pendiente', value: 2 }, { label: 'Aprobado', value: 3 }];
  estatusOptions = [ { label: 'Registrado', value: 1 }, { label: 'Pendiente', value: 2 }, { label: 'Aprobado', value: 3 },];

  pageIndex = 0;
  pageSize = 50

   constructor(
    private fb: FormBuilder,
    private cd: ChangeDetectorRef,
    private terceroService: TerceroService,
    private loaderService: LoaderService,
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      busqueda: this.fb.group({
        tipoConcepto: [2],
        concepto: [null]
      }),
    });

    this.filtrosTabla = this.fb.group({
        tipoOrden: [null],
        anio: [null],
        quincena: [null],

    });
      this.cargarConceptos();
      this.form.get('busqueda.tipoConcepto')?.valueChanges.subscribe(tipo => {
      this.actualizarConceptos(tipo);
    });

    this.form.get('busqueda.concepto')?.valueChanges.subscribe(() => {
      this.pageIndex = 0;
      this.paginator?.firstPage();
      this.loadRegistros(0, this.pageSize);
    });

    this.filtrosTabla.valueChanges.subscribe(() => {
      this.pageIndex = 0;
      this.paginator?.firstPage();
      this.loadRegistros(0, this.pageSize);
    });
  }

  cargarConceptos(){
  this.terceroService.obtenerConceptos().subscribe({
    next: (data: any[]) => {

      this.conceptosInstitucionales = (data ?? []).filter((c: any) =>
      this.conceptosInstitucionalesCodigos.includes((c.cve ?? '').toLowerCase())
      );


      this.conceptosInstitucionales = this.dedupeByCve(this.conceptosInstitucionales);
      this.conceptosInstitucionales = this.ordenarPorPrioridad(
        this.conceptosInstitucionales,
        this.conceptosInstitucionalesCodigos
      );

      this.conceptosNoInstitucionales = data.filter((c: any) =>
        this.conceptosNoInstitucionalesCodigos.includes((c.cve ?? '').toLowerCase())
      );

      this.conceptosNoInstitucionales = this.dedupeByCve(this.conceptosNoInstitucionales);
      this.conceptosNoInstitucionales = this.ordenarPorPrioridad(
        this.conceptosNoInstitucionales,
        this.conceptosNoInstitucionalesCodigos
      );

      // default
      this.conceptosFiltrados = this.conceptosNoInstitucionales;

      this.cd.detectChanges();
    },
    error: (err) => {
      console.error('Error al cargar conceptos:', err);
    }
  });
  }

  actualizarConceptos(tipo: any){
    if(tipo == 1 || tipo === '1'){
      this.conceptosFiltrados = this.conceptosInstitucionales;
    } else {
      this.conceptosFiltrados = this.conceptosNoInstitucionales;
    }
    this.form.get('busqueda.concepto')?.setValue(null, { emitEvent: false });
  }

  private ordenarPorPrioridad(conceptos: any[], codigosPrioridad: string[]): any[] {
    const rank = new Map<string, number>();
    codigosPrioridad.forEach((c, i) => rank.set(c.toLowerCase(), i));

    return [...conceptos].sort((a, b) => {
      const ca = (a?.cve ?? '').toString().toLowerCase();
      const cb = (b?.cve ?? '').toString().toLowerCase();

      const ra = rank.has(ca) ? rank.get(ca)! : Number.POSITIVE_INFINITY;
      const rb = rank.has(cb) ? rank.get(cb)! : Number.POSITIVE_INFINITY;

      if (ra !== rb) return ra - rb;

      // desempate (opcional): por cve o descripción
      return ca.localeCompare(cb);
    });
  }

  private dedupeByCve(conceptos: any[]): any[] {
    const map = new Map<string, any>();

    for (const c of conceptos ?? []) {
      const key = (c?.cve ?? '').toString().toLowerCase().trim();
      if (!key) continue;

      // conserva el primero (o cambia si quieres conservar el último)
      if (!map.has(key)) map.set(key, c);
    }

    return Array.from(map.values());
  }

  private buildQnaProceso(): number | null {
    const anio = this.filtrosTabla.get('anio')?.value;
    const quincena = this.filtrosTabla.get('quincena')?.value;
    if (!anio || !quincena) return null;
    return Number(anio) * 100 + Number(quincena);
  }

  loadRegistros(pageIndex = this.pageIndex, pageSize = this.pageSize): void {
    const concepto: string | null = this.form.get('busqueda.concepto')?.value ?? null;
    const qnaProceso = this.buildQnaProceso();

    if (!concepto) {
      this.dataSource.data = [];
      this.totalElements = 0;
      return;
    }

    this.loaderService.show(); // si tu LoaderService tiene show/hide
    this.terceroService.obtenerRegistrosNp({
      concepto,
      qnaProceso,
      page: pageIndex,
      size: pageSize,
    }).subscribe({
      next: (res) => {
        this.dataSource.data = res.rows;
        this.totalElements = res.total;

        this.pageIndex = pageIndex;
        this.pageSize = pageSize;

        this.cd.detectChanges();
        this.loaderService.hide();
      },
      error: (err) => {
        console.error('Error al cargar registros NP:', err);
        this.dataSource.data = [];
        this.totalElements = 0;
        this.loaderService.hide();
      }
    });
  }

  clearFilters(): void {
    this.form.patchValue(
      { busqueda: { tipoConcepto: 2, concepto: null } },
      { emitEvent: false }
    );

    this.filtrosTabla.reset(
      { tipoOrden: null, anio: null, quincena: null },
      { emitEvent: false }
    );

    this.pageIndex = 0;
    this.pageSize = 50;
    this.paginator?.firstPage();
    this.actualizarConceptos(2);
    this.dataSource.data = [];
    this.totalElements = 0;
    this.cd.detectChanges();
  }

  onPage(e: PageEvent): void {
    this.loadRegistros(e.pageIndex, e.pageSize);
  }
}

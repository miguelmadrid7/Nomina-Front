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
import { finalize } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';

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
    MatRadioModule,
    MatCheckboxModule,
    MatInputModule
  ],
  templateUrl: './consulta-terceros.html',
  styleUrl: './consulta-terceros.css'
})
export class ConsultaTerceros {

  @ViewChild(MatPaginator) paginator?: MatPaginator;

  dataSource = new MatTableDataSource<NominaRow>([]);
  displayedColumns: string[] = [ 'validar', 'rfc', 'curp', 'nombreCompleto', 'numeroOrden', 'tipoOrden', 'importeMensual', 'concepto', 'qnaProceso', 'estatus', 'fechaRegistro'];

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
  
  conteoPorConcepto = new Map<string, number>();
  loadingConteos = false;


  tipoOrdenOptions = [ { label: 'Alta', value: 1 }, { label: 'Pendiente', value: 2 }, { label: 'Aprobado', value: 3 }];
  estatusOptions = [ { label: 'Registrado', value: 1 }, { label: 'Pendiente', value: 2 }, { label: 'Aprobado', value: 3 },];

  pageIndex = 0;
  pageSize = 50

   constructor(
    private fb: FormBuilder,
    private cd: ChangeDetectorRef,
    private snackBar: MatSnackBar,
    private terceroService: TerceroService,
    private loaderService: LoaderService,
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      busqueda: this.fb.group({
        tipoConcepto: [2],
        concepto: [null],
      }),
    });

    this.filtrosTabla = this.fb.group({
        tipoOrden: [null],
        anio: [null],
        quincena: [null],
        estatus: [null],
        rfc: [null],
        curp: [null],
    });

    this.filtrosTabla.valueChanges.subscribe(() => {
      this.pageIndex = 0;
      this.loadConteos();
      this.paginator?.firstPage();
      this.loadRegistros(0, this.pageSize);
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
  }

  buscar(): void {
    this.pageIndex = 0;
    this.paginator?.firstPage();

    this.loadConteos();
    this.loadRegistros(0, this.pageSize);
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

  buildQnaProceso(): number | null {
    const anio = this.filtrosTabla.get('anio')?.value;
    const quincena = this.filtrosTabla.get('quincena')?.value;
    if (!anio || !quincena) return null;
    return Number(anio) * 100 + Number(quincena);
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }

  descargarExcel(): void {
    const concepto: string | null = this.form.get('busqueda.concepto')?.value ?? null;
    const qnaProceso = this.buildQnaProceso();

    if (!concepto) {
      this.snackBar.open('Selecciona un concepto', 'Cerrar', { duration: 4000 });
      return;
    }
    if (!qnaProceso) {
      this.snackBar.open('Selecciona año y quincena', 'Cerrar', { duration: 4000 });
      return;
    }

    this.loaderService.show();
    this.terceroService.descargarRegistrosNpExcel(qnaProceso, concepto)
      .pipe(finalize(() => this.loaderService.hide()))
      .subscribe({
        next: (blob) => this.downloadBlob(blob, `registros_np_${concepto}_${qnaProceso}.xlsx`),
        error: (err) => {
          const msg = err?.error?.message || err?.message || 'Error al descargar Excel';
          this.snackBar.open(msg, 'Cerrar', { duration: 4000 });
        }
      });
  }

  descargarPdf(): void {
    const concepto: string | null = this.form.get('busqueda.concepto')?.value ?? null;
    const qnaProceso = this.buildQnaProceso();

    if (!concepto) {
      this.snackBar.open('Selecciona un concepto', 'Cerrar', { duration: 4000 });
      return;
    }
    if (!qnaProceso) {
      this.snackBar.open('Selecciona año y quincena', 'Cerrar', { duration: 4000 });
      return;
    }

    this.loaderService.show();
    this.terceroService.descargarRegistrosNpPdf(qnaProceso, concepto)
      .pipe(finalize(() => this.loaderService.hide()))
      .subscribe({
        next: (blob) => this.downloadBlob(blob, `registros_np_${concepto}_${qnaProceso}.pdf`),
        error: (err) => {
          const msg = err?.error?.message || err?.message || 'Error al descargar PDF';
          this.snackBar.open(msg, 'Cerrar', { duration: 4000 });
        }
      });
  }

  private loadConteos(): void {
    const qnaProceso = this.buildQnaProceso();
      this.conteoPorConcepto.clear();
        if (!qnaProceso) {
          this.cd.detectChanges();
          return;
        }

      this.loadingConteos = true;

      this.terceroService.obtenerConteoPorConcepto(qnaProceso)
        .pipe(finalize(() => {
          this.loadingConteos = false;
          this.cd.detectChanges();
        }))
        .subscribe({
          next: (rows) => {
            const map = new Map<string, number>();
              for (const r of rows ?? []) {
                const key = (r.cve ?? '').toLowerCase().trim();
                  if (!key) continue;
                    map.set(key, Number(r.total ?? 0));
              }
            this.conteoPorConcepto = map;
          },
            error: (err) => {
              console.error('Error conteos por concepto', err);
              this.conteoPorConcepto.clear();
            }
          });
  }

  get totalConceptoSeleccionado(): number | null {
    const concepto = this.form.get('busqueda.concepto')?.value;
    if (!concepto) return null;

    const key = String(concepto).toLowerCase().trim();
    return this.conteoPorConcepto.get(key) ?? 0;
  }

  loadRegistros(pageIndex = this.pageIndex, pageSize = this.pageSize): void {
    const concepto: string | null = this.form.get('busqueda.concepto')?.value ?? null;
    const qnaProceso = this.buildQnaProceso();

    if (!concepto) {
      this.dataSource.data = [];
      this.totalElements = 0;
      return;
    }

    const start = Date.now();
    this.loaderService.show()
    
    this.terceroService.obtenerRegistrosNp({
      concepto,
      qnaProceso,
      page: pageIndex,
      size: pageSize,
    }).pipe(
      finalize(() => {
        const elapsed = Date.now() - start;
        const remaining = Math.max(0, 4000 - elapsed); // 300ms mínimo
          setTimeout(() => this.loaderService.hide(), remaining);
    })

    ).subscribe({
      next: (res) => {
        this.dataSource.data = res.rows;
        const tipoOrdenSel = this.filtrosTabla.get('tipoOrden')?.value; 
        const estatusSel = this.filtrosTabla.get('estatus')?.value;
        const rfcSel = this.filtrosTabla.get('rfc')?.value;
        const curpSel = this.filtrosTabla.get('curp')?.value;     
        let rows = res.rows ?? [];

        if (tipoOrdenSel != null && tipoOrdenSel !== '') {
          const tipoOrdenNum = Number(tipoOrdenSel);
          rows = rows.filter((r: any) => Number(r?.tipoOrden) === tipoOrdenNum);
        }

        if (estatusSel != null && estatusSel !== '') {
          rows = rows.filter((r: any) => String(r?.estatus ?? '').trim() === String(estatusSel).trim());
        }

        if (rfcSel != null && rfcSel !== '') {
          rows = rows.filter((r: any) => String(r?.rfc ?? '').toLowerCase().includes(String(rfcSel).toLowerCase()));
        }

        if (curpSel != null && curpSel !== '') {
          rows = rows.filter((r: any) => String(r?.curp ?? '').toLowerCase().includes(String(curpSel).toLowerCase()));
        }

        this.dataSource.data = rows;
        this.totalElements = rows.length;
        this.pageIndex = pageIndex;
        this.pageSize = pageSize;
        this.cd.detectChanges();
        this.loaderService.hide();
      },
      error: (err) => {
        this.dataSource.data = [];
        this.totalElements = 0;
        const msg =
          err?.error?.message ||
          err?.message ||
          'Error al cargar registros NP';

        this.snackBar.open(msg, 'Cerrar', { duration: 4000 });
      }
    });
  }

  clearFilters(): void {
    this.form.patchValue(
      { busqueda: { tipoConcepto: 2, concepto: null } },
      { emitEvent: false }
    );

    this.filtrosTabla.reset(
      { tipoOrden: null, anio: null, quincena: null, rfc: null, curp: null },
      { emitEvent: false }
    );

    this.pageIndex = 0;
    this.pageSize = 50;
    this.paginator?.firstPage();
    this.actualizarConceptos(2);
    this.dataSource.data = [];
    this.totalElements = 0;
    this.conteoPorConcepto.clear();
    this.cd.detectChanges();
  }

  isAllChecked(): boolean {
    const rows = this.dataSource.data ?? [];
    return rows.length > 0 && rows.every(r => !!(r as any).validado);
  }

  isSomeChecked(): boolean {
    const rows = this.dataSource.data ?? [];
    const checked = rows.filter(r => !!(r as any).validado).length;
    return checked > 0 && checked < rows.length;
  }

  toggleAll(checked: boolean): void {
    const rows = this.dataSource.data ?? [];
    rows.forEach(r => (r as any).validado = checked);
    this.dataSource.data = [...rows]; // fuerza refresh de tabla
  }

  toggleRow(row: any, checked: boolean): void {
    row.validado = checked;
    this.dataSource.data = [...this.dataSource.data]; // fuerza refresh
  }

  onPage(e: PageEvent): void {
    this.loadRegistros(e.pageIndex, e.pageSize);
  }
}

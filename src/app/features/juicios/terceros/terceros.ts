import { CommonModule } from '@angular/common';
import { Component, ViewChild, NgZone, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { TerceroService } from '../../../core/services/tercero.service';
import { NominaRow } from '../../../models/nomina-Row.model';
import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BeneficiarioJMRequest } from '../../../models/beneficiario-jm-request.model';
import { MatInputModule } from '@angular/material/input';
import { forkJoin } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { NominaordConceptoDialog } from '../../nomina/nominaord-concepto-dialog/nominaord-concepto-dialog';

@Component({
  selector: 'app-terceros',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTableModule,
    MatIconModule,
    MatPaginatorModule,
    MatAutocompleteModule,
    MatInputModule,
  ],
  templateUrl: './terceros.html',
  styleUrl: './terceros.css'
})
export class Terceros {

  private filtersReady = true;
  private isRefreshing = false;
  private lastQnaKey: string | null = null;
  private qnaDebounceId: any;


  @ViewChild(MatAutocompleteTrigger) autocompleteTrigger?: MatAutocompleteTrigger;
  @ViewChild(MatPaginator) paginator?: MatPaginator;

  dataSource = new MatTableDataSource<NominaRow>([]);
  filterValues = { curp: '', rfc: '', nombreEmpleado: ''};
  displayedColumns: string[] = [ 'rfc', 'curp', 'nombreCompleto', 'liquides', 'qnaProceso', 'acciones'];

  form!: FormGroup;
  detailForm!: FormGroup;
  anio: number[] = [2026, 2025, 2024];
  quincena: number[] = Array.from({ length: 24 }, (_, i) => i + 1);
  concepto: any[] = [];
  beneficiarios: any[] = [];
  totalElements = 0;
  showRecords = true;
  anioSeleccionado: number | null = null;
  quincenaSeleccionada: number | null = null;
  selectedRow: any;
  resultado: BeneficiarioJMRequest[] = [];

   cargandoBusqueda = false;

  
  constructor(
    private fb: FormBuilder, 
    private terceroService: TerceroService,
    private snackBar: MatSnackBar,
    private zone: NgZone,
    private cd: ChangeDetectorRef,
    private dialog: MatDialog
  ) {}


  ngOnInit() {
    this.form = this.fb.group({ 
      anio: [''],
      quincena: [''],
      concepto: [null],

      busqueda: this.fb.group({
        empleadoId: [null],
        searchText: ['']
      }),

      empleado: this.fb.group({
        rfc: [''],
        primerApellido: [''],
        segundoApellido: [''],
        nombre: ['']
      })
    });
    this.detailForm = this.fb.group({
      rfc: [''],
      nombreCompleto: [''],
      qnaProceso: ['']
    });
    this.cargarConceptos();
  }

  private showSnack(message: string, action: string, duration: number): void {
    this.zone.runOutsideAngular(() => {
      setTimeout(() => {
        this.zone.run(() => this.snackBar.open(message, action, { duration }));
      }, 50);
    });
  }
  
  onQnaModelChange(): void {
    if (!this.showRecords || !this.filtersReady) return;
    clearTimeout(this.qnaDebounceId);
    this.qnaDebounceId = setTimeout(() => {
      const key = `${this.anioSeleccionado}-${this.quincenaSeleccionada}`;
      if (this.lastQnaKey !== key && !this.isRefreshing) {
        this.lastQnaKey = key;
      }
    }, 0);
  }

  editar(row: any) {
    this.selectedRow = row;
    this.detailForm.patchValue(row);
  }

  eliminar(row: any) {
    console.log('Eliminar:', this.selectedRow);
  }

  applyFilter(column: 'curp' | 'rfc' | 'nombreEmpleado', value: string) {
    this.filterValues[column] = (value ?? '').trim().toUpperCase();
    this.dataSource.filter = JSON.stringify(this.filterValues);
  }

  // Quita prefijos tipo "RFC - CURP - " y códigos tipo RFC/CURP al inicio
  private limpiarNombreCompleto(s?: string): string {
    const raw = (s ?? '').toString().replace(/\s{2,}/g, ' ').trim();
    if (!raw) return '';

    // Si viene con separadores "-", quédate con el último segmento (normalmente el nombre)
    // Ej: "AAAA... - BBBB... - ALDANA ALDANA ALFREDO" => "ALDANA ALDANA ALFREDO"
    const lastSeg = raw.split('-').map(x => x.trim()).filter(Boolean).pop() ?? raw;

    // Quita códigos tipo RFC/CURP (13 a 18 alfanum) al inicio
    const sinCodigosInicio = lastSeg.replace(/^(?:[A-Z0-9]{13,18}\s*)+/, '').trim();
    return sinCodigosInicio.replace(/\s{2,}/g, ' ').trim();
  }

  private repartirNombre(emp: BeneficiarioJMRequest): { primerApellido: string; segundoApellido: string; nombre: string } {
    const limpia = (x?: string) => (x ?? '').toString().trim().replace(/\s{2,}/g, ' ');
    let pa = limpia(emp.primerApellido);
    let sa = limpia(emp.segundoApellido);
    let no = limpia(emp.nombre);

    // Si nombre viene contaminado, límpialo
    no = this.limpiarNombreCompleto(no);

    // Si ya están las 3 partes, respeta
    if (pa && sa && no) return { primerApellido: pa, segundoApellido: sa, nombre: no };

    // Si faltan apellidos, intenta deducirlos desde 'no'
    const tokens = no.split(/\s+/).filter(Boolean);

    if ((!pa || !sa) && tokens.length >= 3) {
      // Heurística MX más común: AP_PATERNO AP_MATERNO NOMBRES...
      if (!pa) pa = tokens[0];
      if (!sa) sa = tokens[1];
      no = tokens.slice(2).join(' ');
    } else if ((!pa || !no) && tokens.length === 2) {
      // 2 tokens: asume AP_PATERNO + NOMBRES
      if (!pa) pa = tokens[0];
      no = tokens[1];
    }
    // Con 1 token no hay mucho que repartir: lo dejamos como nombre

    return { primerApellido: limpia(pa), segundoApellido: limpia(sa), nombre: limpia(no) };
  }

  empleadoSeleccionado(emp: BeneficiarioJMRequest) {
    const partes = this.repartirNombre(emp);
  
    this.form.patchValue({
      busqueda:{
        empleadoId: Number(emp.id),
        searchText: this.displayEmpleado(emp)
      },
      empleado: {
        rfc: emp.rfc ?? '',
        primerApellido: partes.primerApellido,
        segundoApellido: partes.segundoApellido,
        nombre: partes.nombre
      }
    });
  
    this.resultado = [];
    this.autocompleteTrigger?.closePanel();
  
    if (emp.id) {
      this.cargarBeneficiarios(emp.id);
    }
  }

  cargarBeneficiarios(empleadoId: number) {
    this.terceroService.getobtenerBeneficiarios(empleadoId).subscribe({
      next: (resp: any) => {
        const data = resp?.data ?? resp;
        const source = Array.isArray(data?.beneficiarios)
          ? data.beneficiarios
          : Array.isArray(data)
          ? data
          : Array.isArray(data?.content)
            ? data.content
            : [];

        const mapped = source.map((e: any) => ({
          ...e,
          id: e?.id ?? null,
          tabBeneficiariosJmId: e?.tabBeneficiariosJmId ?? null,
          nombreCompleto: `${e?.primerApellido ?? ''} ${e?.segundoApellido ?? ''} ${e?.nombre ?? ''}`.trim().replace(/\s{2,}/g, ' '),
          importeTotal: Number(e?.importeTotal ?? 0),
          factorImporte: Number(e?.factorImporte ?? 0),
          qnaini: Number(e?.qnaini ?? 0),
          qnafin: e?.qnafin != null ? Number(e.qnafin) : null,
          bancoId: e?.bancoId ?? e?.idBanco ?? null,
          clabe: e?.clabe ?? e?.clabeInterbancaria ?? null,
          status: e?.estatus ?? e?.status ?? 'ACTIVO',
          numeroDocumento: e?.numeroDocumento ?? e?.citaBancaria ?? null,
          formaAplicacion: e?.formaAplicacion ?? null,
          rfc: e?.rfc ?? e?.tabBeneficiario?.rfc ?? ''
        }));

     
        this.beneficiarios = mapped;
        this.totalElements = mapped.length;
        this.cd.detectChanges();

    
    },
    error: () => this.showSnack('Error al cargar beneficiarios', 'Cerrar', 4000)
  });
}

  displayEmpleado(emp: BeneficiarioJMRequest | string | null): string {
    if (!emp) return '';
    if (typeof emp === 'string') return emp;
  
    const isCode = (s?: string) => !!s && /^[A-Z0-9]{13,18}$/.test(s.trim());
  
    const fullName = [emp.primerApellido, emp.segundoApellido, emp.nombre]
      .filter(x => x && !isCode(x))
      .join(' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
  
    // Si no hay nombre limpio, muestra solo RFC; si lo hay, RFC - Nombre
    return [emp.rfc || '', fullName || ''].filter(Boolean).join(' - ');
  }

  buscarEmpleado(search?: string) {
    const texto = search ?? this.form.get('busqueda.searchText')?.value;
      if (!texto || texto.trim() === '') return;
        this.terceroService.searchEmpleadoLibre(texto).subscribe({
          next: (resp: any) => {
            const data = resp?.data ?? [];
            const mapped = data.map((e: any) => {
            const partes = (e.empleado ?? '').split(' - ');
        return {
          rfc: partes[0] ?? '',
          curp: partes[1] ?? '',
          nombreCompleto: partes[2] ?? '',
          liquides: 0, 
          id: e.id
        };
      });
      this.dataSource.data = mapped;
      this.totalElements = mapped.length;
      this.dataSource.paginator = this.paginator!;

      

    },
      error: (err) => {
        console.error('Error al buscar empleados:', err);
      }
    });
  }

  clearFilters(): void {
    this.form.patchValue({
      busqueda: {
        searchText: '',
        empleadoId: null,
        rfc: '',
        primerApellido: '',
        segundoApellido: '',
        nombre: ''
      },
      empleado: {
        rfc: '',
        primerApellido: '',
        segundoApellido: '',
        nombre: ''
      }
    }, { emitEvent: false });

    this.resultado = [];
    this.autocompleteTrigger?.closePanel();

    this.dataSource.data = [];

    this.beneficiarios = [];
    this.totalElements = 0;

    this.anioSeleccionado = null;
    this.quincenaSeleccionada = null;
    this.form.get('anio')?.reset(null, { emitEvent: false });
    this.form.get('quincena')?.reset(null, { emitEvent: false });

    this.paginator?.firstPage?.();

    this.cd.markForCheck();
  }

  enforceUppercase(evt: Event) {
    const input = evt.target as HTMLInputElement;
    input.value = (input.value ?? '').toUpperCase();
  }

  cargarConceptos(){
    this.terceroService.obtenerConceptos().subscribe({
      next: (resp) => {
        const data = resp?.data ?? resp;
        this.concepto = data;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar conceptos:', err);
      }
    });
  }

  verNomina(row: any) {

  // 🔥 AQUÍ ARMAS LOS DETALLES SIN BACKEND
  const detalles = this.beneficiarios.map((b: any) => ({
    noComprobante: row.noComprobante ?? 1,
    tipoConcepto: 'D', // terceros normalmente deducciones
    concepto: `BENEFICIARIO - ${b.nombreCompleto}`,
    importe: Number(b.importeTotal ?? 0)
  }));

  // 🔥 ABRES EL MISMO DIALOG REUTILIZADO
  this.dialog.open(NominaordConceptoDialog, {
    width: '900px',
    data: {
      empleadoId: row.id,
      nombreEmpleado: row.nombreCompleto,
      curp: row.curp,
      rfc: row.rfc,
      plaza: row.plaza ?? '',
      qnaTexto: `${this.form.value.anio}/${String(this.form.value.quincena).padStart(2,'0')}`,
      detalles
    }
  });
  }
}

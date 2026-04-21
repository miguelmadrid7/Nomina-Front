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
import { MatDialog } from '@angular/material/dialog';
import { NominaordConceptoDialog } from '../../nomina/nominaord-concepto-dialog/nominaord-concepto-dialog';
import { UppercaseDirective } from "../../../shared/directives/upperCase.directivas";
import { ApiResponse } from '../../../models/api-Response.model';

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
  displayedColumns: string[] = [ 'rfc', 'curp', 'nombreCompleto', 'numeroDocumento', 'tipoOrden', 'importeMensual', 'concepto', 'qnaProceso', 'estatus', 'acciones'];
  tipoOrdenOptions = [
    { label: 'Alta' },
    { label: 'Baja' },
    { label: 'Cambio' }
  ];

   estatusOptions = [
    { label: 'Registrado' },
    { label: 'Pendiente' },
    { label: 'Aprobado' }
  ];


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
  showFilters = true;

  search: string = '';


  
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
      tipoOrden: [null],
      estatus: [null],

      busqueda: this.fb.group({
        empleadoId: [null],
        searchText: ['']
      }),

      empleado: this.fb.group({
        rfc: [''],
        curp: [''],
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

  buscarEmpleado() {
    const value = this.form.get('busqueda.searchText')?.value;
    if (value && typeof value === 'object') return;

    const texto = typeof value === 'string' ? value.trim() : '';
    if (!texto) {
      this.resultado = [];
      this.autocompleteTrigger?.closePanel();
      this.showSnack('Captura un criterio de busqueda', 'Cerrar', 4000);
      return;
    }
    if (texto.length < 3) {
      this.resultado = [];
      this.autocompleteTrigger?.closePanel();
      this.showSnack('Captura almenos 3 caractares para buscar', 'Cerrar', 4000);
      return;
    }

    this.cargandoBusqueda = true;
    this.terceroService.getBuscarEmpleado(texto).subscribe({
      next: (resp: ApiResponse<BeneficiarioJMRequest[]>) => {
        const lista = resp?.data ?? [];

        // Filtra entradas sin datos útiles para evitar “— · — · — · —”
        this.resultado = lista.filter(e =>
          (e?.rfc && e.rfc.trim()) ||
          (e?.primerApellido && e.primerApellido.trim()) ||
          (e?.segundoApellido && e.segundoApellido.trim()) ||
          (e?.nombre && e.nombre.trim())
        );

        this.cargandoBusqueda = false;
        if (this.resultado.length > 0) {
          setTimeout(() => this.autocompleteTrigger?.openPanel());
        } else {
          this.autocompleteTrigger?.closePanel();
        }
      },
      error: () => {
        this.cargandoBusqueda = false;
        this.showSnack('Error en la busqueda', 'Cerrar', 4000);
      }
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

    const lastSeg = raw.split('-').map(x => x.trim()).filter(Boolean).pop() ?? raw;
    const sinCodigosInicio = lastSeg.replace(/^(?:[A-Z0-9]{13,18}\s*)+/, '').trim();
    return sinCodigosInicio.replace(/\s{2,}/g, ' ').trim();
  }

  private repartirNombre(emp: BeneficiarioJMRequest): { primerApellido: string; segundoApellido: string; nombre: string } {
    const limpia = (x?: string) => (x ?? '').toString().trim().replace(/\s{2,}/g, ' ');
    let pa = limpia(emp.primerApellido);
    let sa = limpia(emp.segundoApellido);
    let no = limpia(emp.nombre);

    no = this.limpiarNombreCompleto(no);
    if (pa && sa && no) return { 
      primerApellido: pa, 
      segundoApellido: sa, nombre: no 
    };

    const tokens = no.split(/\s+/).filter(Boolean);

    if ((!pa || !sa) && tokens.length >= 3) {
      if (!pa) pa = tokens[0];
      if (!sa) sa = tokens[1];
      no = tokens.slice(2).join(' ');
    } else if ((!pa || !no) && tokens.length === 2) {
      if (!pa) pa = tokens[0];
      no = tokens[1];
    }
    return { primerApellido: limpia(pa), segundoApellido: limpia(sa), nombre: limpia(no) };
  }

  empleadoSeleccionado(emp: BeneficiarioJMRequest) {
  const partes = this.repartirNombre(emp);

  const partesRaw = (emp as any).empleado?.split(' - ') ?? [];

  const row: any = {
    rfc: partesRaw[0] ?? '',
    curp: partesRaw[1] ?? '',
    nombreCompleto: partesRaw[2] ?? `${partes.primerApellido} ${partes.segundoApellido} ${partes.nombre}`
  };

  this.dataSource.data = [row];
  this.totalElements = 1;

  this.resultado = [];
  this.autocompleteTrigger?.closePanel();
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

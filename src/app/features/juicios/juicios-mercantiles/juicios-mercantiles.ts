import { ChangeDetectorRef, Component, NgZone, ViewChild } from '@angular/core';
import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { rfcValidator, factorImporteValidator, vigenciaRangoValidator } from '../../../shared/validators/juicios.validators';
import { JuiciosMercantilesService } from '../../../core/services/juicios-mercantiles.services';
import { BeneficiarioJMRequest } from '../../../models/beneficiario-jm-request.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Banco } from '../../../models/banco.model';
import { MatTableModule } from '@angular/material/table';
import { BeneficiarioJmDialog } from '../../../shared/dialogs/beneficiario-jm-dialog/beneficiario-jm-dialog';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { ApiResponse } from '../../../models/api-Response.model';
import { clamp, perQnaAmount, quincenasTranscurridas, toAaaaqq } from '../../../shared/validators/validaciones.validators';

@Component({
  selector: 'app-juicios-mercantiles',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatAutocompleteModule,
    MatCardModule,
    MatSelectModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
  ],
  templateUrl: './juicios-mercantiles.html',
  styleUrls: ['./juicios-mercantiles.css']
})
export class JuiciosMercantiles {
  constructor(private fb: FormBuilder, 
    private juiciosMercantilesService: JuiciosMercantilesService, 
    private dialog: MatDialog,  
    private zone: NgZone, 
    private snackBar: MatSnackBar,
    private cd: ChangeDetectorRef ) {}

  @ViewChild(MatAutocompleteTrigger) autocompleteTrigger?: MatAutocompleteTrigger;
  @ViewChild(MatPaginator) paginator?: MatPaginator;
  
  form!: FormGroup;
  resultado: BeneficiarioJMRequest[] = [];
  cargandoBusqueda = false;
  filterValues = { rfc: '', primerApellido:'', segundoApellido: '', nombre: ''};
  formaAplicacion: string = '';
  factorImporte: number | null = null;
  bancos: Banco[] = [];
  vigenciaInicio: string = '';
  vigenciaFin: string = '';
  anio: number[] = [2026, 2025, 2024];
  quincena: number[] = Array.from({ length: 24 }, (_, i) => i + 1);
  anioSeleccionado: number | null = null;
  quincenaSeleccionada: number | null = null;
  beneficiarios: any[] = [];
  showRecords = true;
  isRefreshing = false;
  filtersReady = true;
  lastQnaKey: string | null = null;
  qnaDebounceId: any;
  displayedColumns: string[] = [ 'rfc', 'nombreCompleto', 'qnaProceso', 'formaAplicacion', 'importeTotal', 'restoPagar', 'citaBancaria', 'status', 'acciones'];
  totalElements = 0;


  ngOnInit() {
    this.form = this.fb.group({
      busqueda: this.fb.group({
        searchText: [''],
        empleadoId: [null],
        rfc: [''],
        primerApellido: [''],
        segundoApellido: [''],
        nombre: ['']
      }),
      empleado: this.fb.group({
        rfc: ['', []],
        primerApellido: [''],
        segundoApellido: [''],
        nombre: [''],
      }),
      beneficiario: this.fb.group({
        rfc: ['', [rfcValidator]],
        primerApellido: [''],
        segundoApellido: [''],
        nombre: [''],
      }),
      descuento: this.fb.group({
        formaAplicacion: [''],
        factorImporte: [null],
        bancoId: [null],
        clabe: ['', []],
        importeTotal: [null],
        citaBancaria: ['']
      }),
      vigencia: this.fb.group({
        inicio: [''],
        fin: ['']
      }),
      anio: [null],
      quincena: [null],
    },

    { validators: [factorImporteValidator(), vigenciaRangoValidator()]}
  );

    this.juiciosMercantilesService.getBancos().subscribe({
      next: (resp) => {
        this.bancos = resp?.data ?? [];
      },
      error: () => {
        this.bancos = [];
        this.showSnack('Error al cargar catálogo de bancos', 'Cerrar', 4000);
      }
    });
  }

  // Agregar este método helper a la clase
  private showSnack(message: string, action: string, duration: number): void {
    this.zone.runOutsideAngular(() => {
      setTimeout(() => {
        this.zone.run(() => this.snackBar.open(message, action, { duration }));
      }, 50);
    });
  }

  private recalcBeneficiariosView(): void {
    const selA = this.anioSeleccionado ?? null;
    const selQ = this.quincenaSeleccionada ?? null;
    const aaaaqqSel = (selA && selQ) ? toAaaaqq(selA, selQ) : null;

    this.beneficiarios = (this.beneficiarios ?? []).map((e: any) => {
      const total = Number(e?.importeTotal ?? 0);
      const porQna = perQnaAmount(e);
      const trans = quincenasTranscurridas(Number(e?.qnaini ?? 0), Number(e?.qnafin ?? 0), aaaaqqSel);
      const acumulado = clamp(porQna * trans, 0, total);
      const resto = clamp(total - acumulado, 0, total);
      return { ...e, descuentoQna: porQna, pagadoAcumulado: acumulado, restoPagar: resto };
    });
    this.cd.markForCheck();
  }


  buscarEmpleado() {
    const value = this.form.get('busqueda.searchText')?.value;
    if (value && typeof value === 'object') return;

    const texto = typeof value === 'string' ? value.toLowerCase() : '';
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
    this.juiciosMercantilesService.getBuscarEmpleado().subscribe({
      next: (resp: ApiResponse<BeneficiarioJMRequest[]>) => {
        const lista: BeneficiarioJMRequest[] = resp?.data ?? [];
        this.resultado = lista.filter((b: BeneficiarioJMRequest) =>
          b.rfc?.toLowerCase().includes(texto) ||
          b.primerApellido?.toLowerCase().includes(texto) ||
          b.segundoApellido?.toLowerCase().includes(texto) ||
          b.nombre?.toLowerCase().includes(texto)
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

  empleadoSeleccionado(emp: BeneficiarioJMRequest) {
    this.form.patchValue({
      busqueda:{
        empleadoId: Number(emp.id),
        searchText: emp
      },

      empleado: {
        rfc: emp.rfc ?? '',
        primerApellido: emp.primerApellido ?? '',
        segundoApellido: emp.segundoApellido ?? '',
        nombre: emp.nombre ?? ''
      }
    });
    this.resultado = [];
    this.autocompleteTrigger?.closePanel();
    
    if(emp.id){
      this.cargarBeneficiarios(emp.id);
    }
  }

  displayEmpleado(emp: BeneficiarioJMRequest | string | null): string {
    if (!emp) return '';
    if (typeof emp === 'string') return emp;
    return `${emp.rfc} - ${emp.primerApellido} ${emp.segundoApellido} ${emp.nombre}`;
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.showSnack('Formulario inválido', 'Cerrar', 4000);
      return; 
    }

    const formValue = this.form.value;
    const raw = this.form.get('busqueda.empleadoId')?.value;
    const empleadoId = raw !== null && raw !== undefined ? Number(raw) : NaN;
    if (!Number.isFinite(empleadoId)) {
      this.showSnack('Seleccionar primero un empleado', 'Cerrar', 4000);
      return;
    }

    
    const payload = {
      tabEmpleadosId: empleadoId,
      tabBeneficiariosJmId: formValue.beneficiario?.id, 
      formaAplicacion: formValue.descuento?.formaAplicacion,
      factorImporte: formValue.descuento?.factorImporte,
      numeroBenef: 1,
      qnaini: formValue.vigencia?.inicio,
      qnafin: formValue.vigencia?.fin,
      numeroDocumento: formValue.descuento?.citaBancaria
    };

    this.juiciosMercantilesService.agregarBeneficiario(payload).subscribe({
      next: () => {
        this.showSnack('Beneficiario guardado correctamente', 'Cerrar', 4000);
        this.clearFilters();
      },
       error: () => {
        this.showSnack('Error al guardar beneficiario' , 'Cerrar', 4000);
      }
    })

  }

  onFactorImporteInput() {
    if (this.factorImporte == null) return;
    if (this.formaAplicacion === 'P') {
      let valor = this.factorImporte.toString();
      valor = valor.replace(/\D/g, '');
      if (valor.length > 3) {
        valor = valor.substring(0, 3);
      }
      let numero = Number(valor);
      if (numero > 100) {
        numero = 100;
      }
      this.factorImporte = numero;
    }

    if (this.formaAplicacion === 'C') {
      let numero = Number(this.factorImporte);
      if (isNaN(numero)) {
        this.factorImporte = undefined as any;
        return;
      }
      if (numero < 0) {
        this.factorImporte = 0;
      }
    }
  }

  onVigenciaInput(tipo: 'inicio' | 'fin') {
    if (tipo === 'inicio') {
      if (!this.vigenciaInicio) return;
      let valor = this.vigenciaInicio.toString();
      valor = valor.replace(/\D/g, '');
      if (valor.length > 6) {
        valor = valor.substring(0, 6);
      }
      this.vigenciaInicio = valor;
    }

    if (tipo === 'fin') {
      if (!this.vigenciaFin) return;
      let valor = this.vigenciaFin.toString();
      valor = valor.replace(/\D/g, '');
      if (valor.length > 6) {
        valor = valor.substring(0, 6);
      }
      this.vigenciaFin = valor;
    }
  }

  onQnaModelChange(): void {
    const a = this.form.get('anio')?.value;
    const q = this.form.get('quincena')?.value;
    this.anioSeleccionado = a != null ? Number(a) : null;
    this.quincenaSeleccionada = q != null ? Number(q) : null;

    clearTimeout(this.qnaDebounceId);
    this.qnaDebounceId = setTimeout(() => {
      const key = `${this.anioSeleccionado}-${this.quincenaSeleccionada}`;
      if (this.lastQnaKey !== key && !this.isRefreshing) {
        this.lastQnaKey = key;
        // refresh(); // si no haces llamada al back, puedes omitirlo
      }
      this.recalcBeneficiariosView();
    }, 0);
  }

  refresh(): void {
   
  }

  modalBeneficiario(beneficiario?: any): void {
    console.log('item para editar', beneficiario?.id, beneficiario);
    const raw = this.form.get('busqueda.empleadoId')?.value;
    const empleadoId = raw !== null && raw !== undefined ? Number(raw) : NaN;
      if (!Number.isFinite(empleadoId)) {
        this.showSnack('Seleccionar un empleado primero', 'Cerrar', 4000);
        return;
      }

    const dialogRef = this.dialog.open(BeneficiarioJmDialog, {
      width: '1200px',
      maxWidth: '92vw',
      maxHeight: '90vh',
      panelClass: 'jm-dialog-panel',
      disableClose: false,
      data: {
        empleadoId,
        bancos: this.bancos,
        modo: beneficiario ? 'editar' : 'crear',
        beneficiario
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      this.cargarBeneficiarios(empleadoId);
    });
  }

  cargarBeneficiarios(empleadoId: number) {
  this.juiciosMercantilesService.getobtenerBeneficiarios(empleadoId).subscribe({
    next: (resp: any) => {
      const raw = resp?.data ?? [];
      const mapped = raw.map((e: any) => ({
        ...e,
        id: e?.id ?? null,                    // <-- forzar preservación del ID NOM
        tabBeneficiariosJmId: e?.tabBeneficiariosJmId ?? null,
        nombreCompleto: `${e?.primerApellido ?? ''} ${e?.segundoApellido ?? ''} ${e?.nombre ?? ''}`.trim().replace(/\s{2,}/g, ' '),
        importeTotal: Number(e?.importeTotal ?? 0),
        factorImporte: Number(e?.factorImporte ?? 0),
        qnaini: Number(e?.qnaini ?? 0),
        qnafin: e?.qnafin != null ? Number(e.qnafin) : null,
        bancoId: e.bancoId ?? e.idBanco ?? null,
        clabe: e.clabe ?? e.clabeInterbancaria ?? null
      }));  

      setTimeout(() => {
        this.beneficiarios = mapped;
        this.totalElements = mapped.length;
        this.recalcBeneficiariosView();
        this.cd.markForCheck();
      });
    },
    error: () => this.showSnack('Error al cargar beneficiarios', 'Cerrar', 4000)
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

    this.beneficiarios = [];
    this.totalElements = 0;

    this.anioSeleccionado = null;
    this.quincenaSeleccionada = null;
    this.form.get('anio')?.reset(null, { emitEvent: false });
    this.form.get('quincena')?.reset(null, { emitEvent: false });

    this.paginator?.firstPage?.();

    this.cd.markForCheck();
  }
}


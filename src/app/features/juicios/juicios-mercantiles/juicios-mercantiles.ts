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
import { MatPaginatorModule } from '@angular/material/paginator';
import { ApiResponse } from '../../../models/api-Response.model';

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


  // Control de refrescos y QNA
  isRefreshing = false;
  filtersReady = true;
  lastQnaKey: string | null = null;
  qnaDebounceId: any;
  displayedColumns: string[] = [ 'rfc', 'nombreCompleto', 'importeTotal', 'formaAplicacion', 'qnaProceso', 'citaBancaria', 'clabeInterbancaria', 'institucionBancaria', 'acciones'];
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
      empleadoId,
      rfc: formValue.beneficiario?.rfc,
      primerApellido: formValue.beneficiario?.primerApellido,
      segundoApellido: formValue.beneficiario?.segundoApellido,
      nombre: formValue.beneficiario?.nombre
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

    // FACTOR (porcentaje)
    if (this.formaAplicacion === 'P') {

      let valor = this.factorImporte.toString();

      // Solo números
      valor = valor.replace(/\D/g, '');

      // Máximo 3 dígitos
      if (valor.length > 3) {
        valor = valor.substring(0, 3);
      }

      let numero = Number(valor);

      // Máximo 100%
      if (numero > 100) {
        numero = 100;
      }

      this.factorImporte = numero;
    }

    // IMPORTE FIJO
    if (this.formaAplicacion === 'C') {
      // Solo validar que sea número positivo
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

      // Solo números
      valor = valor.replace(/\D/g, '');

      // Máximo 6 dígitos
      if (valor.length > 6) {
        valor = valor.substring(0, 6);
      }

      this.vigenciaInicio = valor;
    }

    if (tipo === 'fin') {
      if (!this.vigenciaFin) return;

      let valor = this.vigenciaFin.toString();

      // Solo números
      valor = valor.replace(/\D/g, '');

      // Máximo 6 dígitos
      if (valor.length > 6) {
        valor = valor.substring(0, 6);
      }

      this.vigenciaFin = valor;
    }
  }

  onQnaModelChange(): void {
    if (!this.showRecords || !this.filtersReady) return;
    clearTimeout(this.qnaDebounceId);
    this.qnaDebounceId = setTimeout(() => {
      const key = `${this.anioSeleccionado}-${this.quincenaSeleccionada}`;
      if (this.lastQnaKey !== key && !this.isRefreshing) {
        this.lastQnaKey = key;
        this.refresh();
      }
    }, 0);
  }


  refresh(): void {
   
  }

  modalBeneficiario(beneficiario?: any): void {
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
    // SOLO refrescar la tabla
    this.cargarBeneficiarios(empleadoId);
  });
  }

  cargarBeneficiarios(empleadoId: number){
    this.juiciosMercantilesService.getobtenerBeneficiarios(empleadoId).subscribe({
      next: (resp:any) => {
        this.beneficiarios = resp.data ?? [];
        this.totalElements = this.beneficiarios.length;
        this.cd.detectChanges();
      },
      error: () => {
        this.showSnack('Error al cargar beneficiarios', 'Cerrar', 4000);
      }
    });
  }


  clearFilters(): void {
    this.form.reset();
    this.resultado = [];
    this.autocompleteTrigger?.closePanel();
  }
}


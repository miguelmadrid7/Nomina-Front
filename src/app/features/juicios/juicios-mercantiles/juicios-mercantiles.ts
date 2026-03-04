import { Component, ViewChild } from '@angular/core';
import { EmpleadoItem } from '../../../models/emplado.model';
import { PensionAlimenticiaService } from '../../../core/services/pension-alimenticia.service';
import { ApiResponse } from '../../../models/api-Response.model';
import { Empleado } from '../../servicios/empleado';
import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { BeneficiarioRequest } from '../../../models/beneficiario.model';
import { IdResponse } from '../../../models/id-Response.model';
import { PensionAlimenDialog } from '../../nomina/pension-alimen-dialog/pension-alimen-dialog';
import { MatDialog } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { Banco } from '../../../models/banco.model';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { rfcValidator, clabeValidator, factorImporteValidator, vigenciaRangoValidator } from '../../../shared/validators/juicios.validators';

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
  ],
  templateUrl: './juicios-mercantiles.html',
  styleUrls: ['./juicios-mercantiles.css']
})
export class JuiciosMercantiles {
    
  constructor(
    private fb: FormBuilder,
    private pensionAlimenticiaService: PensionAlimenticiaService,  
    private dialog: MatDialog) {}

  @ViewChild(MatAutocompleteTrigger) autocompleteTrigger?: MatAutocompleteTrigger;
  
  form!: FormGroup;
  submitted = false;
  resultados: EmpleadoItem[] = [];
  bancos: Banco[] = [];
  guardando = false;
  cargandoBusqueda = false;


  ngOnInit() {
    this.form = this.fb.group({
      beneficiario: this.fb.group({
        rfc: ['', [rfcValidator]],
        apellidoPaterno: [''],
        apellidoMaterno: [''],
        nombreCompleto: [''],
      }),

      descuento: this.fb.group({
        formaAplicacion: [''],
        factorImporte: [null],
        bancoId: [null],
        clabe: ['', [clabeValidator]],
        importeTotal: [null],
        citaBancaria: [''] 
      }),

      vigencia: this.fb.group({
        inicio: [''],
        fin: ['']
      }),
      
      busqueda: this.fb.group({           
        searchText: [''],
        empleadoId: [null]
      })
    },

    {
      validators: [
        factorImporteValidator(),
        vigenciaRangoValidator()
      ]
    });
  }

 

  get gBenef() { 
    return this.form.get('beneficiario') as FormGroup; 
  }

  get gDesc()  { 
    return this.form.get('descuento') as FormGroup; 
  }

  get gVig()   { 
    return this.form.get('vigencia') as FormGroup; 
  }

  get gBusq()  { 
    return this.form.get('busqueda') as FormGroup; 
  }

  get formaAplicacion(): 'P' | 'C' | '' {
    return (this.gDesc.get('formaAplicacion')?.value || '') as any;
  }

  onRfcInput() {
    const c = this.gBenef.get('rfc')!;
    const v = String(c.value || '').toUpperCase().replace(/[^A-Z0-9Ñ&]/g, '');
    c.setValue(v, { emitEvent: false });
  }

  onVigenciaInput(ctrl: 'inicio' | 'fin') {
    const c = this.gVig.get(ctrl)!;
    let v = String(c.value || '').replace(/\D/g, '').slice(0, 6);
    c.setValue(v, { emitEvent: false });
  }

  onFormaChange() {
    this.gDesc.get('factorImporte')?.reset(null);
  }

  onFactorImporteInput() {
    const forma = this.gDesc.get('formaAplicacion')?.value;
    const c = this.gDesc.get('factorImporte')!;
    let val = String(c.value ?? '').replace(/\D/g, '');

    if (forma === 'P') {
      val = val.slice(0, 3);
      let num = Number(val);
      if (num > 100) num = 100;
      c.setValue(num, { emitEvent: false });
    } else {
      const num = Number(val || '0');
      c.setValue(Number.isNaN(num) ? null : num, { emitEvent: false });
    }
  }

  onSearchInputChange() {
    const q = (this.gBusq.get('searchText')?.value || '').trim();
    if (!q) {
      this.resultados = [];
      this.autocompleteTrigger?.closePanel();
      this.gBusq.get('empleadoId')?.setValue(null);
    }
  }

  clearSearch() {
    this.gBusq.patchValue({ searchText: '', empleadoId: null });
    this.resultados = [];
    this.gBenef.patchValue({ nombreCompleto: '', apellidoMaterno: '', apellidoPaterno: '' });
  }

  selectEmpleado(emp: EmpleadoItem) {
    if (emp?.id == null) {
      console.warn('Empleado sin id');
      this.gBusq.get('empleadoId')?.setValue(null);
      return;
    }
    this.gBusq.get('empleadoId')?.setValue(Number(emp.id));

    const rfc = (emp.rfc ?? (emp as any).RFC ?? '').toString().trim();
    const pa  = (emp.primer_apellido ?? (emp as any).primerApellido ?? '').toString().trim();
    const sa  = (emp.segundo_apellido ?? (emp as any).segundoApellido ?? '').toString().trim();
    const no  = (emp.nombre ?? '').toString().trim();
    const nombre = (emp as any).nombreCompleto?.toString().trim()
                  || [pa, sa, no].filter(Boolean).join(' ');

    this.gBenef.patchValue({
      rfc: rfc.toUpperCase(),
      apellidoPaterno: pa.toUpperCase(),
      apellidoMaterno: sa.toUpperCase(),
      nombreCompleto: (nombre || '').toUpperCase()
    });

    this.gBusq.get('searchText')?.setValue(this.displayEmpleado(emp));
    this.autocompleteTrigger?.closePanel();
  }

  onSubmit() {
    this.submitted = true;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();

    // Normalizar factor
    let factor = Number(v.descuento.factorImporte);
    if (this.formaAplicacion === 'P' && factor > 1) factor = factor / 100;

    // CLABE ya validada por validador
    const clabe = String(v.descuento.clabe).trim();

    // Construye payloads
    const beneficiarioAlimPayload = {
      rfc: v.beneficiario.rfc,
      primerApellido: v.beneficiario.apellidoPaterno,
      segundoApellido: v.beneficiario.apellidoMaterno,
      nombre: v.beneficiario.nombreCompleto
    };

    this.guardando = true;
    const fail = (msg: string) => {
      this.dialog.open(PensionAlimenDialog, { width: '360px', data: { title: 'Faltan datos', message: msg, type: 'error' } });
      this.guardando = false;
    };

    if (!v.busqueda?.empleadoId) return fail('Selecciona un empleado antes de guardar.');

    this.pensionAlimenticiaService.addBeneficiarioAlim(beneficiarioAlimPayload).subscribe({
      next: (resp: ApiResponse<IdResponse>) => {
        const beneficiarioAlimId = resp?.data?.id;
        if (!beneficiarioAlimId) { fail('No se recibió ID del beneficiario base.'); return; }

        const beneficiarioPayload: BeneficiarioRequest = {
          tabEmpleadosId: v.busqueda.empleadoId,
          tabBeneficiariosAlimId: beneficiarioAlimId,
          formaAplicacion: v.descuento.formaAplicacion as 'P' | 'C',
          factorImporte: factor,
          qnaini: Number(v.vigencia.inicio),
          qnafin: Number(v.vigencia.fin),
          numeroDocumento: clabe,
        };

        this.pensionAlimenticiaService.addBeneficario(beneficiarioPayload).subscribe({
          next: () => {
            this.dialog.open(PensionAlimenDialog, { width: '360px', data: { title: 'Éxito', message: 'Se guardó correctamente tus datos.', type: 'success' } });
            this.guardando = false;
            // reset sin perder búsqueda/empleado
            const searchText = this.gBusq.get('searchText')?.value;
            const empleadoId = this.gBusq.get('empleadoId')?.value;
            this.form.reset();
            this.gBusq.patchValue({ searchText, empleadoId });
          },
          error: () => { fail('Error al guardar pensión alimenticia.'); }
        });
      },
      error: () => { fail('No se pudo crear el beneficiario base.'); }
    });
  }

  // Muestra en autocomplete
  displayEmpleado(emp: EmpleadoItem | string | null): string {
    if (!emp) return '';
    if (typeof emp === 'string') return emp;
    const rfc  = (emp.rfc ?? (emp as any).RFC ?? '').toString().trim() || '—';
    const curp = (emp.curp ?? (emp as any).CURP ?? '').toString().trim() || '—';
    const nombre = (emp.nombreCompleto ?? '').toString().trim() || '—';
    return `${rfc} · ${curp} · ${nombre}`;
  }

  // Wrapper para (optionSelected)
  onOptionSelected(emp: EmpleadoItem) {
    this.selectEmpleado(emp);
  }

  // Helpers para detectar si el término es RFC o CURP
  private esRFC(v: string): boolean {
    return /^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{2,3}$/.test(v);
  }

  private esCURP(v: string): boolean {
    return /^[A-Z][AEIOUX][A-Z]{2}[0-9]{6}[HM][A-Z]{5}[0-9A-Z]{2}$/.test(v);
  }

  // Botón "Buscar"
  searchEmployee() {
    const q = (this.gBusq.get('searchText')?.value || '').trim().toUpperCase();
    if (!q) { this.resultados = []; return; }
    this.cargandoBusqueda = true;

    const obs =
      this.esRFC(q) ? this.pensionAlimenticiaService.searchPorTarget('RFC', q) :
      this.esCURP(q) ? this.pensionAlimenticiaService.searchPorTarget('CURP', q) :
                      this.pensionAlimenticiaService.searchEmpleadoLibre(q);

    obs.subscribe({
      next: (resp: ApiResponse<Empleado | Empleado[]>) => {
        const d = resp?.data;
        const arr = Array.isArray(d) ? d : (d ? [d] : []);
        this.resultados = arr.map((emp: any) => {
          const rfc = (emp?.rfc ?? emp?.RFC ?? '').toString().trim();
          const curp = (emp?.curp ?? emp?.CURP ?? '').toString().trim();
          const pa = (emp?.primer_apellido ?? emp?.primerApellido ?? '').toString().trim();
          const sa = (emp?.segundo_apellido ?? emp?.segundoApellido ?? '').toString().trim();
          const no = (emp?.nombre ?? '').toString().trim();
          const nombre = [pa, sa, no].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
          return { ...emp, rfc, curp, nombreCompleto: nombre } as EmpleadoItem;
        });
        this.cargandoBusqueda = false;
        setTimeout(() => {
          if (!this.autocompleteTrigger) return;
          this.resultados.length > 0 ? this.autocompleteTrigger.openPanel()
                                    : this.autocompleteTrigger.closePanel();
        });
      },
      error: () => {
        this.resultados = [];
        this.cargandoBusqueda = false;
        this.autocompleteTrigger?.closePanel();
      }
    });
  }

  // Alias para (ngSubmit)="guardar()"
  guardar() { 
    this.onSubmit(); 
  }

}

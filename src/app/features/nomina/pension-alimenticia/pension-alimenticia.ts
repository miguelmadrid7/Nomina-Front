import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatOption, MatSelectModule } from '@angular/material/select';
import { PensionAlimenticiaService } from '../../../core/services/pension-alimenticia.service';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { Empleado } from '../../servicios/empleado';
import { EmpleadoItem } from '../../../models/emplado.model';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PensionAlimenDialog } from '../pension-alimen-dialog/pension-alimen-dialog';
import { IdResponse } from '../../../models/id-Response.model';
import { Banco } from '../../../models/banco.model';
import { BeneficiarioRequest } from '../../../models/beneficiario.model';
import { ApiResponse } from '../../../models/api-Response.model';

@Component({
  selector: 'app-pension-alimenticia',
  standalone: true,
  imports: [
    MatFormFieldModule,
    CommonModule,
    FormsModule,
    MatInputModule,
    MatCardModule,
    MatButtonModule,
    MatSelectModule,
    MatOption,
    MatAutocompleteModule,
    MatOptionModule,
    MatIconModule,
    MatDialogModule,
  ],
  templateUrl: './pension-alimenticia.html',
  styleUrl: './pension-alimenticia.css'
})
export class PensionAlimenticia {

  rfc: string = '';
  apellidoPaterno: string = '';
  apellidoMaterno: string = '';
  nombreCompleto: string = '';

  empleadoId: number | null = null;
  formaAplicacion: string = '';
  factorImporte: number | null = null;
  numeroBeneficiario: number | null = null;
  vigenciaInicio: string = '';
  vigenciaFin: string = '';
  numeroDocumento: string = '';

  bancos: Banco[] = [];
  bancoSeleccionado: number | null = null;

  searchText: string = '';
  selectedEmpleado: EmpleadoItem | null = null;
  resultados: EmpleadoItem[] = [];
  cargandoBusqueda = false;
  guardando = false;



  constructor(
    private pensionAlimenticiaService: PensionAlimenticiaService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.cargarBancos();
  }

  // Normaliza a MAYÚSCULAS y trim seguro
  private toUpper(v: any): string {
    return (String(v ?? '')).toUpperCase().trim();
  }

  // RFC persona física común (simplificado, en mayúsculas)
  private esRFC(v: string) {
    return /^[A-ZÑ&]{4}\d{6}[A-Z0-9]{3}$/.test(v);
  }

  // CURP (simplificado)
  private esCURP(v: string) {
    return /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/.test(v);
  }

  displayEmpleado(emp: EmpleadoItem | string | null): string {
      if (!emp) return '';
      if (typeof emp === 'string') return emp; // mientras escribes
      const rfc  = (emp.rfc ?? emp.RFC ?? '').toString().trim() || '—';
      const curp = (emp.curp ?? emp.CURP ?? '').toString().trim() || '—';
      const pa = (emp.primer_apellido ?? emp.primerApellido ?? '').toString().trim();
      const sa = (emp.segundo_apellido ?? emp.segundoApellido ?? '').toString().trim();
      const no = (emp.nombre ?? '').toString().trim();
      const concatenado = (emp.empleado ?? '').toString().trim();
      const nombre = (concatenado || [pa, sa, no].filter(Boolean).join(' '))
        .replace(/\s+/g,' ')
        .trim() || '—';
      return `${rfc} · ${curp} · ${nombre}`;
  }

  onOptionSelected(emp: EmpleadoItem) {
    this.selectEmpleado(emp);
    this.searchText = this.displayEmpleado(emp);
  }

  searchEmployee() {
  const q = (this.searchText || '').trim().toUpperCase();
  if (!q) { this.resultados = []; return; }
  this.cargandoBusqueda = true;

  // deja pasar si es RFC/CURP parcial con >=3
  const targetRFC  = this.esRFC(q)  ? 'RFC'  : null;
  const targetCURP = this.esCURP(q) ? 'CURP' : null;

  if (q.length < 3 && !this.esRFC(q) && !this.esCURP(q)) {
    this.resultados = [];
    this.cargandoBusqueda = false;
    return;
  }

  const obs =
    (this.esRFC(q) || (targetRFC && q.length >= 3))  ? this.pensionAlimenticiaService.searchPorTarget('RFC', q)  :
    (this.esCURP(q) || (targetCURP && q.length >= 3))? this.pensionAlimenticiaService.searchPorTarget('CURP', q) :
                                                       this.pensionAlimenticiaService.searchEmpleadoLibre(q);


      obs.subscribe({
        next: (resp: ApiResponse<Empleado | Empleado[]>) => {
          const d = resp?.data;
          const arr = Array.isArray(d) ? d : (d ? [d] : []);
          this.resultados = arr.map((emp: EmpleadoItem) => {
            const pa = (emp?.primer_apellido ?? emp?.primerApellido ?? '').toString().trim();
            const sa = (emp?.segundo_apellido ?? emp?.segundoApellido ?? '').toString().trim();
            const no = (emp?.nombre ?? '').toString().trim();
            const concatenado = (emp?.empleado ?? '').toString().trim();
            const nombre = (concatenado || [pa, sa, no].filter(Boolean).join(' '))
              .replace(/\s+/g, ' ')
              .trim();
            return {
              ...emp,
              nombreCompleto: nombre,
              rfc: (emp?.rfc ?? emp?.RFC ?? '').toString().trim(),
              curp: (emp?.curp ?? emp?.CURP ?? '').toString().trim()
            } as EmpleadoItem;
          });
          this.cargandoBusqueda = false;
        },
        error: () => {
          this.resultados = [];
          this.cargandoBusqueda = false;
        }
      });
  }

  selectEmpleado(emp: EmpleadoItem) {
  if (emp?.id == null) {
    console.warn('Empleado sin id');
    this.empleadoId = null;
    return;
  }
  this.empleadoId = emp.id;

  }

  cargarBancos(): void {
    this.pensionAlimenticiaService.getBancos()
    .subscribe({
      next: (response: ApiResponse<Banco[]>) => {
        this.bancos = response.data;
      },
      error: (err: any) => {
        console.error('Error al  cargar bancos', err)
      }
    })
  }

  guardar(form?: NgForm) {
    if (this.guardando) return;

    // Forzar mayúsculas en campos de texto y limpiar CLABE a dígitos
    this.rfc = this.toUpper(this.rfc);
    this.apellidoPaterno = this.toUpper(this.apellidoPaterno);
    this.apellidoMaterno = this.toUpper(this.apellidoMaterno);
    this.nombreCompleto = this.toUpper(this.nombreCompleto);
    this.searchText = this.toUpper(this.searchText);
    this.numeroDocumento = String(this.numeroDocumento ?? '').replace(/\D+/g, '');

    if (form && form.invalid) {
      Object.values(form.controls).forEach(c => c.markAsTouched());
      return;
    }
    this.guardando = true;

    const fail = (msg: string) => {
      this.dialog.open(PensionAlimenDialog, {
        width: '360px',
        data: { title: 'Faltan datos', message: msg, type: 'error' } // <- X en validaciones
      });
      this.guardando = false;
    };

    if (!this.empleadoId) return fail('Selecciona un empleado antes de guardar.');
    if (!['P','F'].includes(this.formaAplicacion)) return fail('Selecciona la forma de aplicación.');
    if (this.factorImporte == null) return fail('Captura Factor/Importe.');
    if (!this.vigenciaInicio || !this.vigenciaFin) return fail('Captura la vigencia de inicio y fin.');

    // Normalizar y validar CLABE (18 dígitos)
    const clabe = String(this.numeroDocumento ?? '').trim();
    if (!/^\d{18}$/.test(clabe)) return fail('La CLABE debe tener exactamente 18 dígitos numéricos.');

    const beneficiarioAlimPayload = {
      rfc: this.rfc,
      primerApellido: this.apellidoPaterno,
      segundoApellido: this.apellidoMaterno,
      nombre: this.nombreCompleto
    };

    this.pensionAlimenticiaService.addBeneficiarioAlim(beneficiarioAlimPayload).subscribe({
      next: (resp: ApiResponse<IdResponse>) =>{
        const beneficiarioAlimId = resp?.data?.id;
        if (!beneficiarioAlimId) {
          this.dialog.open(PensionAlimenDialog, {
            width: '360px',
            data: { title: 'Error', message: 'No se recibió ID del beneficiario base.', type: 'error' }
          });
          this.guardando = false;
          return;
        }

        let factor = Number(this.factorImporte);
        if (Number.isNaN(factor)) {
          return fail('El campo Factor/Importe debe ser numérico.');
        }
        if (this.formaAplicacion === 'P') {
          if (factor > 1) factor = factor / 100;

          if (!(factor > 0 && factor <= 1)) {
            return fail('Para Factor, usa un porcentaje válido (ej. 20 = 20%). Debe ser mayor a 0 y hasta 100%.');
          }
        } else {
          if (factor < 0) {
            return fail('El Importe fijo debe ser mayor o igual a 0.');
          }
        }

        const beneficiarioPayload: BeneficiarioRequest = {
          tabEmpleadosId: this.empleadoId!,
          tabBeneficiariosAlimId: beneficiarioAlimId,
          formaAplicacion: this.formaAplicacion as 'P' | 'F',
          factorImporte: factor,
          qnaini: Number(this.vigenciaInicio),
          qnafin: Number(this.vigenciaFin),
          numeroDocumento: clabe
          // bancoId: this.bancoSeleccionado // agrégalo si tu backend lo requiere
        };

        if (this.numeroBeneficiario != null && !Number.isNaN(Number(this.numeroBeneficiario))) {
          beneficiarioPayload.numeroBenef = Number(this.numeroBeneficiario);
        }

        if ([beneficiarioPayload.factorImporte, beneficiarioPayload.qnaini, beneficiarioPayload.qnafin].some((v: number) => Number.isNaN(v))) {
          return fail('Revisa que los campos numéricos tengan valores válidos.');
        }

        this.pensionAlimenticiaService.addBeneficario(beneficiarioPayload).subscribe({
          next: () => {
            this.dialog.open(PensionAlimenDialog, {
              width: '360px',
              data: { title: 'Éxito', message: 'Se guardó correctamente tus datos.', type: 'success' } // <- palomita
            });
            this.guardando = false;
            // Limpiar formulario (manteniendo empleado seleccionado y búsqueda)
            this.resetForm(form);
          },
          error: err => {
            console.error('Error al guardar pensión alimenticia', err);
            this.dialog.open(PensionAlimenDialog, {
              width: '360px',
              data: { title: 'Error', message: 'Error al guardar pensión alimenticia.', type: 'error' }
            });
            this.guardando = false;
          }
        });
      },
      error: err => {
        console.error('Error al crear beneficiario base', err);
        this.dialog.open(PensionAlimenDialog, {
          width: '360px',
          data: { title: 'Error', message: 'No se pudo crear el beneficiario base.', type: 'error' }
        });
        this.guardando = false;
      }
    });
  }

  // Limpia los campos del formulario de captura (no toca la búsqueda/empleado)
  private resetForm(form?: NgForm) {
    try {
      form?.resetForm();
    } catch {

    }
    this.rfc = '';
    this.apellidoPaterno = '';
    this.apellidoMaterno = '';
    this.nombreCompleto = '';
    this.formaAplicacion = '';
    this.factorImporte = null;
    this.numeroBeneficiario = null;
    this.vigenciaInicio = '';
    this.vigenciaFin = '';
    this.numeroDocumento = '';
    this.bancoSeleccionado = null;
  }

  clearSearch() {
    this.searchText = '';
    this.resultados = [];
    this.cargandoBusqueda = false;
    this.empleadoId = null;
    this.rfc = '';
    this.nombreCompleto = '';
  }

  formatearImporte() {
    if (this.factorImporte == null) return;

    let valor = Number(this.factorImporte);
    if (isNaN(valor)) return;

    if (this.formaAplicacion === 'F') {
      if (valor < 0) valor = 0;
      this.factorImporte = Number(valor.toFixed(2));
    }
  }

  // limpiar el valor al cambiar el tipo
  onFormaChange() {
    this.factorImporte = null;
  }

  // Convierte a mayúsculas y elimina caracteres inválidos si se pegaron
  onRfcInput() {
    this.rfc = (this.rfc || '')
      .toUpperCase()
      .replace(/[^A-Z0-9Ñ&]/g, '');
  }

  // Bloquea teclas no permitidas
  soloRFC(event: KeyboardEvent) {
    const regex = /^[A-Za-z0-9ñÑ&]$/;

    // Permitir teclas de control
    const teclasPermitidas = [
      'Backspace', 'ArrowLeft', 'ArrowRight', 'Tab', 'Delete'
    ];

    if (teclasPermitidas.includes(event.key)) return;

    if (!regex.test(event.key)) {
      event.preventDefault();
    }
  }

  // Bloquea números y caracteres no válidos al escribir
soloLetras(event: KeyboardEvent) {

  // Permitir teclas de control
  const teclasPermitidas = [
    'Backspace', 'ArrowLeft', 'ArrowRight', 'Tab', 'Delete', ' '
  ];

  if (teclasPermitidas.includes(event.key)) return;

  // Solo letras (incluye acentos y Ñ)
  const regex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ]$/;

  if (!regex.test(event.key)) {
    event.preventDefault();
  }
}


// Limpia números si se pegan en el input
onNombreInput(tipo: 'paterno' | 'materno' | 'nombre') {

  const limpiar = (valor: string) =>
    valor
      .replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ\s]/g, '') // elimina números y símbolos
      .replace(/\s+/g, ' ')                  // evita espacios dobles
      .trimStart();                          // evita espacio inicial

  if (tipo === 'paterno') {
    this.apellidoPaterno = limpiar(this.apellidoPaterno);
  }

  if (tipo === 'materno') {
    this.apellidoMaterno = limpiar(this.apellidoMaterno);
  }

  if (tipo === 'nombre') {
    this.nombreCompleto = limpiar(this.nombreCompleto);
  }
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
    if (this.formaAplicacion === 'F') {
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
}

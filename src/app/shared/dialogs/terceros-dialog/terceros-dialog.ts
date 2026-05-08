import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatNativeDateModule, MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { qnaMinimaValidator, qnaRangoValidator } from '../../validators/validaciones.validators';
import flatpickr from 'flatpickr';
import { Spanish } from 'flatpickr/dist/l10n/es';
import { UppercaseDirective } from "../../../shared/directives/upperCase.directivas";
import { TerceroService } from '../../../core/services/tercero.service';

@Component({
  selector: 'app-terceros-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    UppercaseDirective
  ],
  templateUrl: './terceros-dialog.html',
  styleUrl: './terceros-dialog.css'
})
export class TercerosDialog  {

  form!: FormGroup;
  estatusOptions = ['Registrado', 'Pendiente', 'Aprobado'];
  tipoOrdenOptions = [{ label: 'Alta', value: 1 }, { label: 'Pendiente', value: 2 }, { label: 'Aprobado', value: 3 }];
  esAltaFlag = false;
  archivoPdf: File | null = null;
  archivoPdfError: string | null = null;

  constructor(
    private fb: FormBuilder,
    private ref: MatDialogRef<TercerosDialog>,
    private terceroService: TerceroService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    if (!this.data) {
      this.ref.close();
      return;
    }

    const currentQna = this.getCurrentQna();
    const minQna = this.nextQna(currentQna.aaaaqq).aaaaqq;


    this.form = this.fb.group({
      rfc: [this.data?.rfc ?? ''],
      curp: [this.data?.curp ?? ''],
      apellidoPaterno: [this.data?.apellidoPaterno ?? ''],
      apellidoMaterno: [this.data?.apellidoMaterno ?? ''],
      nombres: [this.data?.nombres ?? ''],
      numeroDocumento: [this.data?.numeroDocumento ?? null],
      tipoOrden: [this.mapTipoOrdenFromData(this.data?.tipoOrden)],
      importeMensual: [this.data?.importeMensual ?? null],
      concepto: [this.data.concepto ?? null],
      qnaProceso: [this.data.qnaProceso ?? null],
      qnaDesde: [currentQna.aaaaqq],
      qnaHasta: [''],
      estatus: [this.data?.estatus ?? null],
      fechaRegistro: [{ value: this.data?.fechaRegistro || new Date(), disabled: true }],
    },
    {
      validators: [
        qnaMinimaValidator(minQna),
        qnaRangoValidator()
      ]
    });

    const rfc = this.form.get('rfc')?.value;
    const concepto = this.form.get('concepto')?.value;
    const qnaProceso = this.form.get('qnaProceso')?.value;

    if (rfc && concepto) {
      this.terceroService.getImporteMensualReal(rfc, concepto, qnaProceso).subscribe({
        next: (data) => {
          const importe = Number(data?.importeMensual);
          if (!Number.isNaN(importe)) {
            queueMicrotask(() => this.form.get('importeMensual')?.setValue(importe));
          }
        },
        error: () => {
          // sin-op: mantener el valor original
        }
      });
    }

    this.form.get('tipoOrden')?.valueChanges.subscribe((valor) => {
     this.esAltaFlag = valor === 1;
      if (valor === 1) {
        this.form.get('estatus')?.setValue('Registrado');
        this.form.get('estatus')?.disable(); 
      } else {
        this.form.get('estatus')?.enable(); 
      }
    });

    const inicial = this.form.get('tipoOrden')?.value;
    this.esAltaFlag = Number(inicial) === 1;
  }

  ngAfterViewInit() {
    flatpickr('#fechaHoraInput', {
      enableTime: true,
      dateFormat: 'Y-m-d H:i',
      defaultDate: new Date(),
      time_24hr: true,
      locale: Spanish,
    });
  }

  onPdfSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0] ?? null;
    this.archivoPdfError = null;
    this.archivoPdf = null;

    if (!file) return;

    const isPdf = (file.type || '').toLowerCase() === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      this.archivoPdfError = 'Solo se permite archivo PDF.';
      if (input) input.value = '';
      return;
    }

    this.archivoPdf = file;
  }

  get esAlta(): boolean {
    return Number(this.form?.get('tipoOrden')?.value) === 1;
  }

  getCurrentQna(): { anio: number; qna: number; aaaaqq: number } {
    const now = new Date();
    const anio = now.getFullYear();
    const mes = now.getMonth() + 1;
    const qnaDelMes = (now.getDate() <= 15) ? 1 : 2;
    const qna = (mes - 1) * 2 + qnaDelMes;
    return { anio, qna, aaaaqq: anio * 100 + qna };
  }

  nextQna(aaaaqq: number): { anio: number; qna: number; aaaaqq: number } {
    let anio = Math.floor(aaaaqq / 100);
    let qna = aaaaqq % 100;
    qna += 1;
    if (qna > 24) {
      qna = 1;
      anio += 1;
    }
    return { anio, qna, aaaaqq: anio * 100 + qna };
  }

  guardar() {
    const value = this.form.getRawValue();

    value.nombreTrabajador = [
    value.apellidoPaterno,
    value.apellidoMaterno,
    value.nombres,
      ].map((x: any) => (x ?? '').toString().trim())
        .filter(Boolean)
        .join(' ')
        .trim();
    
    const desdeNum =
      value.qnaDesde !== null && value.qnaDesde !== undefined && value.qnaDesde !== ''
        ? Number(value.qnaDesde)
        : null;

    const hastaNum =
      value.qnaHasta !== null && value.qnaHasta !== undefined && value.qnaHasta !== ''
        ? Number(value.qnaHasta)
        : null;

    value.desde = desdeNum;
    value.qnaIni = desdeNum;
    value.qnaFin = hastaNum; 
    
    value.numeroDocumento =
      value.numeroDocumento !== null && value.numeroDocumento !== undefined && value.numeroDocumento !== ''
        ? Number(value.numeroDocumento)
        : null;

    this.ref.close({
      ...value,
      archivoPdf: this.archivoPdf,
    });
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleString();
  }

  private mapTipoOrdenFromData(valor: any): number | null {
    if (valor == null) return null;
    if (typeof valor === 'number') return valor;

    const v = String(valor).toLowerCase();
    if (v === 'alta') return 1;
    if (v === 'baja') return 2;
    if (v === 'cambio') return 3;
    return null;
  }

  cerrar() {
    this.ref.close();
  }
}
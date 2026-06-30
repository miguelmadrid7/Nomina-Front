import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { PensionAlimenticiaService } from '../../../core/services/pension-alimenticia.service';
import { MatCardModule } from '@angular/material/card';
import { FilaBeneficiario } from '../../../models/filabeneficiario.model';
import { BeneficiarioRequest } from '../../../models/request/beneficiario-request.model';
import { BeneficiarioAlimRequest } from '../../../models/request/beneficiarioalim-request.model';
import { finalize, switchMap } from 'rxjs/operators';
import { UppercaseDirective } from '../../directives/upperCase.directivas';
import { PensionAlimenDialog } from '../../../features/pension-alimenticia/pension-alimen-dialog/pension-alimen-dialog';
import { MatSelectModule } from '@angular/material/select';
import { Banco } from '../../../models/banco.model';
import { ApiResponse } from '../../../models/response/api-Response.model';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { getCurrentQna } from '../../validators/validaciones.validators';

@Component({
  selector: 'app-consulta-pensiones-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatCardModule,
    MatSelectModule,
    MatSlideToggleModule,
    UppercaseDirective,
  ],
  templateUrl: './consulta-pensiones-dialog.html',
  styleUrl: './consulta-pensiones-dialog.css'
})
export class ConsultaPensionesDialog implements OnInit {

  private readonly pensionAlimenticiaService = inject(PensionAlimenticiaService);
  private readonly dialog = inject(MatDialog);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly ref = inject(MatDialogRef<ConsultaPensionesDialog>);
  private readonly fb = inject(FormBuilder);

  form!: FormGroup;
  detalle: any = null;
  bancos: Banco[] = [];
  saving = false;
  bancoSeleccionado: number | null = null;
  porcentajeDisponible = 100;

  readonly data = inject<FilaBeneficiario>(MAT_DIALOG_DATA);

  ngOnInit() {
    this.form = this.fb.group({
      id: [null],
      nombreEmpleado: [''],
      rfcEmpleado: [''],
      curpEmpleado: [''],
      nombreBeneficiario: [''],
      rfc: [''],
      numeroBeneficiario: [''],
      formaAplicacion: [''],
      factorImporte: [''],
      bancoSeleccionado: [null],
      clabe: [''],
      qnaInicio: [''], 
      qnaFin: [''],
      pensionTerminada: [false],
      numeroDocumento: [''], 
      numeroOficio: ['']
    });
      const finCtrl  = this.form.get('qnaFin');
      const termCtrl = this.form.get('pensionTerminada');
      termCtrl?.valueChanges.subscribe((on: boolean) => {
        const { aaaaqq } = getCurrentQna(); 
        if (on) {
          finCtrl?.setValue(aaaaqq.toString()); 
        } else {
          finCtrl?.setValue(''); 
        }
      });
    this.loadBanksCatalog();
    this.cargarDetalle();
  }

  cargarDetalle(): void {
    this.pensionAlimenticiaService.getBeneficiario(this.data.id).subscribe({
      next: (resp) => {
        const arr = resp?.data as any[];
        if (!arr || arr.length === 0) return;
        const d = arr[0];
        this.detalle = d;

        this.form.patchValue({
          nombreEmpleado: this.armarNombreEmpleado(d),
          rfcEmpleado: d.empleado_rfc,
          curpEmpleado: d.empleado_curp,
          nombreBeneficiario: this.armarNombreBeneficiario(d),
          rfc: d.beneficiario_rfc,
          numeroBeneficiario: d.numero_benef ?? '',
          numeroOficio: d.numero_oficio ?? '',
          formaAplicacion: d.forma_aplicacion,
          factorImporte: d.factor_importe,
          bancoSeleccionado: d.cat_banco_id,
          clabe: d.numero_documento ?? '',
          qnaInicio: d.qnaini,
          qnaFin: d.qnafin,
          numeroDocumento: d.numero_documento ?? ''
        }, { emitEvent: false });
        if (d.qnafin) {
          this.form.get('pensionTerminada')?.setValue(true, { emitEvent: false });
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Error al cargar detalle', err)
    });
  }

  private armarNombreEmpleado(d: any): string {
    return [d.empleado_primer_apellido, d.empleado_segundo_apellido, d.empleado_nombre]
      .filter(Boolean)
      .join(' ');
  }

  private armarNombreBeneficiario(d: any): string {
    return [d.beneficiario_primer_apellido, d.beneficiario_segundo_apellido,d.beneficiario_nombre]
      .filter(Boolean)
      .join(' ');
  }

  guardar(): void {
    if (this.saving) return;
    const d = this.form.getRawValue();
    const alimId = this.detalle?.tab_beneficiario_alim_id;
    const nomId  = this.data.id;

    if (!alimId) {
      console.error('No se encontró tab_beneficiario_alim_id');
      return;
    }

    if (!d.rfc || d.factorImporte === null || d.factorImporte === undefined || d.factorImporte === '') {
      console.warn('Faltan campos requeridos');
      return;
    }

    const qIni = Number(d.qnaInicio);
    let qFin   = d.qnaFin ? Number(d.qnaFin) : null;

    if (d.pensionTerminada && !qFin) {
      const { aaaaqq } = getCurrentQna();
      qFin = aaaaqq;
    }

    if (qFin !== null && (Number.isNaN(qFin) || qFin < qIni)) {
      this.dialog.open(PensionAlimenDialog, {
        width: '350px',
        data: { message: 'La QNA fin no puede ser menor a la QNA inicio.', type: 'error' }
      });
      return;
    }

    const alimPayload: BeneficiarioAlimRequest = {
      nombre: d.nombreBeneficiario.split(' ').slice(2).join(' ') || d.nombreBeneficiario,
      primerApellido: d.nombreBeneficiario.split(' ')[0] ?? '',
      segundoApellido: d.nombreBeneficiario.split(' ')[1] ?? '',
      rfc: d.rfc
    };

    let factor = Number((d.factorImporte ?? '').toString().replace(/[$%,]/g, ''));
    if (d.formaAplicacion === 'P' && factor > 1) factor = factor / 100;

    const clabe = (d.clabe || '').toString().replace(/\D+/g, '');
    const nomPayload: BeneficiarioRequest = {
      tabEmpleadosId: this.detalle!.tab_empleado_id,
      tabBeneficiariosAlimId: alimId,
      catBancoId: d.bancoSeleccionado,
      formaAplicacion: d.formaAplicacion as 'P' | 'F',
      factorImporte: factor,
      qnaini: qIni,
      qnafin: 999999,                 
      numeroDocumento: clabe,       
      numeroOficio: d.numeroOficio,
      numeroBenef: d.numeroBeneficiario
    };

    this.saving = true;
    this.pensionAlimenticiaService.updateBeneficiarioAlim(alimId, alimPayload)
      .pipe(switchMap(() => this.pensionAlimenticiaService.updateBeneficiario(nomId, nomPayload)),
       finalize(() => {
          setTimeout(() => {
            this.saving = false;
            this.cdr.detectChanges();
          });
        })
      )
      .subscribe({
        next: () => {
          const dialogRef = this.dialog.open(PensionAlimenDialog, {
            width: '350px',
            data: { message: 'Se actualizó correctamente', type: 'success' }
          });
          dialogRef.afterClosed().subscribe(() => {
            this.ref.close(true); 
          });
        },
        error: (err: any) => {
          console.error('Error al actualizar', err);
          this.dialog.open(PensionAlimenDialog, {
            width: '350px',
            data: { message: 'Error al actualizar', type: 'error' }
          });
        }
      });
  }

  get f(){
    return this.form.controls;
  }

  onFormaChange() {
    this.form.get('factorImporte')?.setValue(null);
  }

  onFactorImporteInput() {
    const formaAplicacion = this.form.get('formaAplicacion')?.value;
    const factorImporte = this.form.get('factorImporte')?.value;
      if (factorImporte == null) return;
      if (formaAplicacion === 'P') {
        let valor = factorImporte.toString();
          valor =  valor.replace(/\D/g, '');
        if (valor.length > 3) {
          valor = valor.substring(0, 3);
        }
        let numero = Number(valor);
        const disponibleReal = this.porcentajeDisponible;
          if (numero > disponibleReal) {
            numero = disponibleReal;
          }
        this.form.get('factorImporte')?.setValue(numero, {
          emitEvent: false
        });
      } else {
        let numero = Number(factorImporte);
        if (isNaN(numero)) {
          return;
        }
        if (numero < 0) {
          numero = 0;
        }
        this.form.get('factorImporte')?.setValue(numero, {
          emitEvent: false
        });
      }
  }

  loadBanksCatalog (): void {
    this.pensionAlimenticiaService.getBancos()
    .subscribe({
      next: (response: ApiResponse<Banco[]>) => {
        setTimeout(() => {
          this.bancos = response.data;
          this.cdr.detectChanges();
        })
        this.bancos = response.data;
      },
      error: (err: any) => {
        console.error('Error al  cargar bancos', err)
      }
    })
  }

  cerrar(): void {
    this.ref.close(null);
  }
}

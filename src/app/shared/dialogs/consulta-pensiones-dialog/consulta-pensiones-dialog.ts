import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { PensionAlimenticiaService } from '../../../core/services/pension-alimenticia.service';
import { MatCardModule } from '@angular/material/card';
import { BeneficiarioRequest, FilaBeneficiario } from '../../../models/beneficiario.model';
import { BeneficiarioAlimRequest } from '../../../models/pension-Alimenticia-model';
import { switchMap } from 'rxjs/operators';
import { UppercaseDirective } from '../../directives/upperCase.directivas';
import { PensionAlimenDialog } from '../../../features/pension-alimenticia/pension-alimen-dialog/pension-alimen-dialog';
import { MatSelectModule } from '@angular/material/select';
import { Banco } from '../../../models/banco.model';
import { ApiResponse } from '../../../models/api-Response.model';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

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
export class ConsultaPensionesDialog implements OnInit{

  form!: FormGroup;
  detalle: any = null;
  bancos: Banco[] = [];
  bancoSeleccionado: number | null = null;
  porcentajeDisponible = 100;

  constructor(
    private  ref: MatDialogRef<ConsultaPensionesDialog>, 
    private fb: FormBuilder,
     @Inject(MAT_DIALOG_DATA) public data: FilaBeneficiario,  
     private pensionAlimenticiaService: PensionAlimenticiaService,  
     private dialog: MatDialog){}

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
      banco: [''],
      bancoSeleccionado: [null],
      clabe: [''],
      qnaInicio: [{ value: '', disabled: true }],
      qnaFin: [''],
      pensionTerminada: [false],
      numeroDocumento: [''], 
      numeroOficio: ['']
    });
    this.loadBanksCatalog();
    this.cargarDetalle();
  }

  cargarDetalle(): void {
    this.pensionAlimenticiaService.getBeneficiario(this.data.id).subscribe({
      next: (resp) => {
        const arr = resp?.data as any[];
          if (!arr || arr.length === 0) {
            return;
          }
        const d = arr[0];
        this.detalle = d;
        console.log(d);
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
            banco: d.nombre_banco ?? '',
            clabe: d.numero_documento ?? '',
            qnaInicio: d.qnaini,
            qnaFin: d.qnafin,
            numeroDocumento: d.numero_documento ?? ''
          });
      },

      error: (err) => {
        console.error('Error al cargar detalle', err);
      }
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
    const d = this.form.value;
    const alimId = this.detalle?.tab_beneficiario_alim_id;
    const nomId  = this.data.id;

    if (!alimId) {
      console.error('No se encontró tab_beneficiario_alim_id');
      return;
    }

    if (!d.rfc || !d.clabe || !d.factorImporte) {
      console.warn('Faltan campos requeridos');
      return;
    }

    const alimPayload: BeneficiarioAlimRequest = {
      nombre: d.nombreBeneficiario.split(' ').slice(2).join(' ') || d.nombreBeneficiario,
      primerApellido: d.nombreBeneficiario.split(' ')[0] ?? '',
      segundoApellido: d.nombreBeneficiario.split(' ')[1] ?? '',
      rfc: d.rfc
    };

    let factor = Number(d.factorImporte?.toString().replace(/[$%,]/g, ''));
    if (d.formaAplicacion === 'Factor' && factor > 1) factor = factor / 100; 

    const nomPayload: BeneficiarioRequest = {
      tabEmpleadosId: this.detalle!.tab_empleado_id,
      tabBeneficiariosAlimId: alimId,
      formaAplicacion: d.formaAplicacion === 'Factor' ? 'P' : 'C',
      factorImporte: factor,
      qnaini: Number(d.qnaInicio),
      qnafin: Number(d.qnaFin),
      numeroDocumento: d.clabe,
      numeroOficio: d.numeroOficio,
      numeroBenef: d.numeroBeneficiario
    };

    this.pensionAlimenticiaService.updateBeneficiarioAlim(alimId, alimPayload)
      .pipe(switchMap(() => this.pensionAlimenticiaService.updateBeneficiario(nomId, nomPayload)))
        .subscribe({
          next: () => {
            const dialogRef = this.dialog.open(PensionAlimenDialog, {
              width: '350px',
              data: {
                message: 'Se actualizó correctamente',
                type: 'success'
              }
            });

            dialogRef.afterClosed().subscribe(() => {
              this.ref.close(true); 
            });
        },
        error: (err: any) => console.error('Error al actualizar', err)
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

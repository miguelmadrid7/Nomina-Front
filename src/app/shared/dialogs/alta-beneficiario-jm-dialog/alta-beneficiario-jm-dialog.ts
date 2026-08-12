import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, NgZone, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Banco } from '../../../core/model/banco.model';
import { JuiciosMercantilesService } from '../../../core/services/juicios-mercantiles.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { factorImporteValidator, vigenciaRangoValidator } from '../../validators/juicios.validators';
import { factorImporteControlValidator, rfcValidator, vigenciaMinimaValidator } from '../../validators/validaciones.validators';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { vigenciaFormatoValidator } from '../../validators/validaciones.validators';
import { startWith, distinctUntilChanged } from 'rxjs';
import { CalendarioService } from '../../../core/services/calendario.service';
import { Calendario } from '../../../core/model/calendario.model';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-beneficiario-jm-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatCardModule,
    MatSelectModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
  ],
  templateUrl: './alta-beneficiario-jm-dialog.html',
  styleUrl: './alta-beneficiario-jm-dialog.css'
})
export class AltaBeneficiarioJmDialog implements OnInit {

  private readonly fb = inject(FormBuilder);
  private readonly juiciosMercantilesService = inject(JuiciosMercantilesService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly zone = inject(NgZone);
  private readonly dialogRef = inject(MatDialogRef<AltaBeneficiarioJmDialog>);
  private readonly calendarioService = inject(CalendarioService);
  private readonly cd = inject(ChangeDetectorRef);
  private readonly toastService = inject(ToastService);

  readonly data = inject<{ empleadoId: number; bancos: Banco[], modo?: 'crear' | 'editar', beneficiario? : any }>(MAT_DIALOG_DATA);
  readonly form = this.fb.group({
    empleado: this.fb.group({
      rfc: [null as string | null, [rfcValidator()]],
      primerApellido: [null as string | null, [Validators.minLength(2)]],
      segundoApellido: [null as string | null, [Validators.minLength(2)]],
      nombre: [null as string | null, [Validators.minLength(2)]],
    }),
    beneficiario: this.fb.group({
      nomId: [null as number | null],
      tabBeneficiariosJmId: [null as number | null],
      rfc: [null as string | null, [rfcValidator()]],
      primerApellido: [null as string | null, [Validators.minLength(2)]],
      segundoApellido: [null as string | null, [Validators.minLength(2)]],
      nombre: [null as string | null, [Validators.minLength(2)]],
      formaAplicacion: [null as string | null],
      factorImporte: [null as number | null, [factorImporteControlValidator()]],
      bancoId: [null as number | null],
      clabe: [null as string | null, [Validators.pattern(/^\d{18}$/)]],
      importeTotal: [null as number | null, [Validators.min(0)]],
      citaBancaria: [null as string | null],
      ctaBancaria: [null as number | null, [Validators.pattern(/^\d{1,10}$/)]],
      estatus: [null as string | null],
      descripcion: [null as string | null],
      inicio: [null as string | null],
      fin: [null as string | null, [vigenciaFormatoValidator()]],
    })
  }, { validators: [factorImporteValidator(), vigenciaRangoValidator()] });

  bancos: Banco[] = [];
  factorDecimal = 0;
  calendarioActual: Calendario | null = null;
  cargandoQna = false;


  ngOnInit(): void {
    this.bancos = this.data?.bancos ?? [];
    this.cargandoQna = true;
    this.calendarioService.getQnaActiva().subscribe({
      next: (response: any) => {
        setTimeout(() => {
          this.calendarioActual = response.data ?? null;
          this.cargandoQna = false;

          if (this.calendarioActual && this.data?.modo !== 'editar') {
            const qnaInicio = `${this.calendarioActual.ejercicio}${this.calendarioActual.qna.toString().padStart(2, '0')}`;
            this.form.patchValue({
              beneficiario: { inicio: qnaInicio }
            }, { emitEvent: false });

            const beneficiarioGroup = this.form.get('beneficiario');
            if (beneficiarioGroup) {
              beneficiarioGroup.addValidators(vigenciaMinimaValidator(Number(qnaInicio)));
              beneficiarioGroup.updateValueAndValidity({ emitEvent: false });
            }
          }
          this.cd.detectChanges();
        }, 0);
      },
      error: () => {
        setTimeout(() => {
          this.cargandoQna = false;
          this.toastService.error('Error', 'No se pudo cargar QNA activa',  6000);
          this.cd.detectChanges();
        }, 0);
      }
    });

    const b = this.form.get('beneficiario') as FormGroup;
    const formaCtrl  = b.get('formaAplicacion')!;
    const factorCtrl = b.get('factorImporte')!;
    const totalCtrl  = b.get('importeTotal')!;

    formaCtrl.valueChanges.pipe(startWith(formaCtrl.value)).subscribe((m: string) => {
      if (m === 'C') {
        totalCtrl.setValidators([Validators.required, Validators.min(0)]);
        totalCtrl.updateValueAndValidity({ emitEvent: false });
        factorCtrl.setValidators([Validators.min(0)]);
        factorCtrl.updateValueAndValidity({ emitEvent: false });
      } else if (m === 'P') {
        factorCtrl.setValidators([
          Validators.required,
          Validators.min(0),
          Validators.max(100),
          Validators.pattern(/^\d{1,3}$/)
        ]);
        factorCtrl.updateValueAndValidity({ emitEvent: false });
        totalCtrl.setValidators([Validators.min(0)]);
        totalCtrl.updateValueAndValidity({ emitEvent: false });
      } else {
        factorCtrl.setValidators([Validators.min(0)]);
        factorCtrl.updateValueAndValidity({ emitEvent: false });
        totalCtrl.setValidators([Validators.min(0)]);
        totalCtrl.updateValueAndValidity({ emitEvent: false });
      }
    });

      factorCtrl.valueChanges.pipe(startWith(factorCtrl.value)).subscribe(v => {
        const n = Number(v);
        this.factorDecimal = Number.isFinite(n) ? n / 100 : 0;
      });

      if (this.data?.beneficiario) {
        const ben = this.data.beneficiario;
        const tab = ben.tabBeneficiario ?? {};
        const bancoMatch = this.bancos.find(
          bk => (bk.banco ?? '').toString().trim().toUpperCase() === (tab.institucionBancaria ?? '').toString().trim().toUpperCase()
      );
      const bancoId = bancoMatch?.id ?? null;
      this.form.patchValue({
        beneficiario: {
          nomId: ben.id,
          tabBeneficiariosJmId: ben.tabBeneficiariosJmId ?? null,
          rfc: (ben.rfc ?? '').toString().toUpperCase().trim(),
          primerApellido: (ben.primerApellido ?? '').toString().toUpperCase().trim(),
          segundoApellido: (ben.segundoApellido ?? '').toString().toUpperCase().trim(),
          nombre: (ben.nombre ?? '').toString().toUpperCase().trim(),
          formaAplicacion: (ben.formaAplicacion ?? '').toString().toUpperCase().trim(),
          citaBancaria: (ben.numeroDocumento ?? '').toString().toUpperCase().trim(),
          factorImporte: ben.factorImporte,
          importeTotal: ben.importeTotal,
          inicio: ben.qnaini,
          fin: ben.qnafin,
          clabe: (tab.clabeInterbancaria ?? '').toString().trim() || null,
          ctaBancaria: tab.ctaBancaria ?? null,
          bancoId,
          estatus: (ben.status ?? ben.estatus ?? '').toString().toUpperCase().trim()
        }
      });
    }

    this.form.get('beneficiario.rfc')?.valueChanges.subscribe(val => {
      if (typeof val === 'string') {
        const up = val.toUpperCase().trim();
        if (val !== up) this.form.get('beneficiario.rfc')?.setValue(up, { emitEvent: false });
      }
    });

    const upperPipe = (path: string) => {
      const c = this.form.get(path);
      c?.valueChanges.pipe(distinctUntilChanged()).subscribe((val: any) => {
        if (typeof val === 'string') {
          const up = val.toUpperCase().trim();
          if (up !== val) c.setValue(up, { emitEvent: false });
        }
      });
    };
    upperPipe('beneficiario.rfc');
    upperPipe('beneficiario.primerApellido');
    upperPipe('beneficiario.segundoApellido');
    upperPipe('beneficiario.nombre');
    upperPipe('beneficiario.formaAplicacion');
    upperPipe('beneficiario.citaBancaria');
    upperPipe('beneficiario.fin');
  }
  
  private showSnack(message: string, action: string, duration: number): void {
    this.zone.runOutsideAngular(() => {
      setTimeout(() => {
        this.zone.run(() => this.snackBar.open(message, action, { duration }));
      }, 50);
    });
  }

  private buildPayload() {
    const v = this.form.value.beneficiario ?? {};
    const S = (x:any)=> typeof x === 'string' ? x.toUpperCase().trim() : (x ?? null);
    const rfc = typeof v.rfc === 'string' ? v.rfc.trim().toUpperCase() : null;
      if (!v.tabBeneficiariosJmId && (!rfc || rfc.length === 0)) {
        this.showSnack('Captura un RFC existente en TAB o selecciona un beneficiario del catálogo.', 'Cerrar', 4000);
        return;
      }

    const bancoNombreSel = this.bancos.find(b => b.id === v.bancoId)?.banco;
    const bancoNombreOrig = (this.data?.beneficiario?.tabBeneficiario?.institucionBancaria ?? '') as string;
      return {
        tabBeneficiariosJmId: v.tabBeneficiariosJmId ?? null,
        tabEmpleadosId: this.data.empleadoId,
        rfc: S(v.rfc),
        primerApellido: S(v.primerApellido),
        segundoApellido: S(v.segundoApellido),
        nombre: S(v.nombre),
        formaAplicacion: S(v.formaAplicacion),
        factorImporte: v.factorImporte != null ? Number(v.factorImporte) : null,
        importeTotal: v.importeTotal != null ? Number(v.importeTotal) : null,
        numeroDocumento: S(v.citaBancaria),
        qnaini: this.calendarioActual ?   Number(`${this.calendarioActual.ejercicio}${this.calendarioActual.qna.toString().padStart(2, '0')}`) :  (v.inicio != null ? Number(v.inicio) : null),
        qnafin: v.fin != null ? Number(v.fin) : null,
        numeroBenef: 1,
        clabeInterbancaria: S(v.clabe),
        ctaBancaria: v.ctaBancaria != null ? Number(v.ctaBancaria) : null,
        institucionBancaria: S(bancoNombreSel || bancoNombreOrig || null)
      };
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastService.warning('Formulario invalido', 'Revisar que los campos a actualizar esten correctos', 6000);
      return;
    }

    const payload = this.buildPayload();
    if (!payload) return;
    const nomId = this.form.get('beneficiario.nomId')?.value ?? this.data?.beneficiario?.id ?? null;

    if (this.data?.modo === 'editar' && nomId) {
      this.juiciosMercantilesService.actualizarBeneficiario(nomId, payload)
        .subscribe({
          next: () => {
            this.cerrar();
            this.toastService.info('Actualización de datos', 'Datos actualizados correctamente', 6000)
          },
            error: () => {
              this.toastService.error('Formulario incorrecto', 'Ocurrió un error al actualizar. Intenta nuevamente', 6000)
            }
          });
      } else {
      this.juiciosMercantilesService.agregarBeneficiario(payload).subscribe({
        next: () => { 
          this.toastService.success('Informacion guardada', 'Beneficiario guardado correctamente', 6000); 
          this.cerrar(); 
        },
        error: () => { 
          this.toastService.error('Error', 'Error al guardar beneficiario', 6000); 
        }
      });
    }
  }

  getCurrentQna(): { anio: number; qna: number; aaaaqq: number } {
    const now = new Date();
    const anio = now.getFullYear();
    const mes = now.getMonth() + 1; 
    const qnaDelMes = (now.getDate() <= 15) ? 1 : 2;  
    const qna = (mes - 1) * 2 + qnaDelMes;           
    return { 
      anio, 
      qna,
      aaaaqq: anio * 100 + qna 
    };
  }

  nextQna(aaaaqq: number): { anio: number; qna: number; aaaaqq: number } {
    let anio = Math.floor(aaaaqq / 100);
    let qna = aaaaqq % 100; 
    qna += 1;
    if (qna > 24) { 
      qna = 1; anio += 1; 
    }
    return { 
      anio, 
      qna, 
      aaaaqq: anio * 100 + qna 
    };
  } 

  cerrar(): void {
    this.dialogRef.close(true);
  }
}
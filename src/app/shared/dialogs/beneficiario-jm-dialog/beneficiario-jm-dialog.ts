import { CommonModule } from '@angular/common';
import { Component, Inject, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Banco } from '../../../models/banco.model';
import { JuiciosMercantilesService } from '../../../core/services/juicios-mercantiles.services';
import { MatSnackBar } from '@angular/material/snack-bar';
import { factorImporteValidator, vigenciaRangoValidator } from '../../validators/juicios.validators';
import { factorImporteControlValidator, rfcValidator, vigenciaMinimaValidator } from '../../../shared/validators/validaciones.validators';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { vigenciaFormatoValidator } from '../../validators/validaciones.validators';
import { SoloLetrasDirectiva } from '../../directives/solo-letras.directivas';
import { startWith, distinctUntilChanged } from 'rxjs';
import { UppercaseDirective } from '../../directives/upperCase.directivas';

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
    SoloLetrasDirectiva, 
    UppercaseDirective
  ],
  templateUrl: './beneficiario-jm-dialog.html',
  styleUrl: './beneficiario-jm-dialog.css'
})
export class BeneficiarioJmDialog {

  form!: FormGroup;
  bancos: Banco[] = [];
  factorDecimal = 0;

  constructor(
    private fb: FormBuilder,
    private juiciosMercantilesService: JuiciosMercantilesService,
    private snackBar: MatSnackBar,
    private zone: NgZone,
    private dialogRef: MatDialogRef<BeneficiarioJmDialog>,
    @Inject(MAT_DIALOG_DATA) public data: { empleadoId: number; bancos: Banco[], modo?: 'crear' | 'editar', beneficiario? : any }
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      empleado : this.fb.group({
        rfc: [null, [rfcValidator()]],                 
        primerApellido: [null, [Validators.minLength(2)]],
        segundoApellido: [null, [Validators.minLength(2)]],
        nombre: [null, [Validators.minLength(2)]],
      }),
      beneficiario: this.fb.group({
        nomId: [null], 
        tabBeneficiariosJmId: [null],
        rfc: [null, [rfcValidator()]],
        primerApellido: [null, [Validators.minLength(2)]],
        segundoApellido: [null, [Validators.minLength(2)]],
        nombre: [null, [Validators.minLength(2)]],
        formaAplicacion: [null],
        factorImporte: [null, [factorImporteControlValidator()]],
        bancoId: [null],
        clabe: [null, [Validators.pattern(/^\d{18}$/)]],
        importeTotal: [null, [Validators.min(0)]],
        citaBancaria: [null],
        ctaBancaria: [null, [Validators.pattern(/^\d{1,10}$/)]],
        estatus: [null],
        descripcion: [null],
        inicio: [null, [vigenciaFormatoValidator()]],
        fin: [null, [vigenciaFormatoValidator()]],
      })
    },
    { validators: [factorImporteValidator(), vigenciaRangoValidator()] });
    this.bancos = this.data?.bancos ?? [];
    
    const curr = this.getCurrentQna();
    const minObj = this.nextQna(curr.aaaaqq);
    const minAaaaqq = minObj.aaaaqq;
    this.form.patchValue({
      beneficiario: {
        inicio: String(minAaaaqq)
      }
    }, { emitEvent: false });
    const beneficiarioGroup = this.form.get('beneficiario');
    if (beneficiarioGroup) {
      beneficiarioGroup.addValidators(vigenciaMinimaValidator(minAaaaqq));
      beneficiarioGroup.updateValueAndValidity({ emitEvent: false });
    }


    const b = this.form.get('beneficiario') as FormGroup;
    const formaCtrl  = b.get('formaAplicacion')!;
    const factorCtrl = b.get('factorImporte')!;
    const totalCtrl  = b.get('importeTotal')!;

    formaCtrl.valueChanges.pipe(startWith(formaCtrl.value)).subscribe((m: string) => {
      if (m === 'C') {
        // Importe fijo
        totalCtrl.setValidators([Validators.required, Validators.min(0)]);
        totalCtrl.updateValueAndValidity({ emitEvent: false });

        factorCtrl.setValidators([Validators.min(0)]); // sin required
        factorCtrl.updateValueAndValidity({ emitEvent: false });
      } else if (m === 'P') {
        // Porcentaje
        factorCtrl.setValidators([
          Validators.required,
          Validators.min(0),
          Validators.max(100),
          Validators.pattern(/^\d{1,3}$/)
        ]);
        factorCtrl.updateValueAndValidity({ emitEvent: false });

        // Importe total permitido pero no requerido
        totalCtrl.setValidators([Validators.min(0)]);
        totalCtrl.updateValueAndValidity({ emitEvent: false });
      } else {
        // Sin selección aún: ambos opcionales
        factorCtrl.setValidators([Validators.min(0)]);
        factorCtrl.updateValueAndValidity({ emitEvent: false });
        totalCtrl.setValidators([Validators.min(0)]);
        totalCtrl.updateValueAndValidity({ emitEvent: false });
      }
    });

    // Hint decimal (1 => 0.01)
    factorCtrl.valueChanges.pipe(startWith(factorCtrl.value)).subscribe(v => {
      const n = Number(v);
      this.factorDecimal = Number.isFinite(n) ? n / 100 : 0;
    });

    if (this.data?.beneficiario) {
      const b = this.data.beneficiario;
      const tab = b.tabBeneficiario ?? {};

      const bancoMatch = this.bancos.find(
        bk => (bk.banco ?? '').toString().trim().toUpperCase() === (tab.institucionBancaria ?? '').toString().trim().toUpperCase()
      );
      const bancoId = bancoMatch?.id ?? null;


      this.form.patchValue({
        beneficiario: {
          nomId: b.id,
          tabBeneficiariosJmId: b.tabBeneficiariosJmId ?? null,
          rfc: (b.rfc ?? '').toString().toUpperCase().trim(),
          primerApellido: (b.primerApellido ?? '').toString().toUpperCase().trim(),
          segundoApellido: (b.segundoApellido ?? '').toString().toUpperCase().trim(),
          nombre: (b.nombre ?? '').toString().toUpperCase().trim(),
          formaAplicacion: (b.formaAplicacion ?? '').toString().toUpperCase().trim(),
          citaBancaria: (b.numeroDocumento ?? '').toString().toUpperCase().trim(),
          factorImporte: b.factorImporte,
          importeTotal: b.importeTotal,
          inicio: b.qnaini,
          fin: b.qnafin,
          
      // CORREGIDO: leer del TAB
      clabe: (tab.clabeInterbancaria ?? '').toString().toUpperCase().trim() || null,
      ctaBancaria: tab.ctaBancaria ?? null,
      bancoId // si hay match por nombre, preselecciona
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
    upperPipe('beneficiario.formaAplicacion'); // es string 'P' | 'C'
    upperPipe('beneficiario.citaBancaria');
    upperPipe('beneficiario.inicio'); // AAAAQQ
    upperPipe('beneficiario.fin');    // AAAAQQ
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

  // Nombre del banco seleccionado (si hay)
  const bancoNombreSel = this.bancos.find(b => b.id === v.bancoId)?.banco;
  // Fallback: el nombre que viene del beneficiario actual (si es edición)
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
    qnaini: v.inicio != null ? Number(v.inicio) : null,
    qnafin: v.fin != null ? Number(v.fin) : null,
    numeroBenef: 1,

    clabeInterbancaria: S(v.clabe),
    ctaBancaria: v.ctaBancaria != null && v.ctaBancaria !== '' ? Number(v.ctaBancaria) : null,
    institucionBancaria: S(bancoNombreSel || bancoNombreOrig || null)
  };
}

  guardar(): void {
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    this.showSnack('Formulario inválido', 'Cerrar', 4000);
    return;
  }

  const payload = this.buildPayload();
  if (!payload) return; // <-- evitar POST sin body
  const nomId = this.form.get('beneficiario.nomId')?.value ?? this.data?.beneficiario?.id ?? null;

  if (this.data?.modo === 'editar' && nomId) {
    this.juiciosMercantilesService.actualizarBeneficiario(nomId, payload)
    .subscribe({
      next: () => { 
        this.showSnack('Beneficiario actualizado correctamente', 'Cerrar', 4000); 
        this.cerrar(); 
      },
      error: () => { 
        this.showSnack('Error al actualizar beneficiario', 'Cerrar', 4000); 
      }
    });

  } else {
    this.juiciosMercantilesService.agregarBeneficiario(payload).subscribe({
      next: () => { 
        this.showSnack('Beneficiario guardado correctamente', 'Cerrar', 4000); 
        this.cerrar(); }
        ,
      error: () => { 
        this.showSnack('Error al guardar beneficiario', 'Cerrar', 4000); 
      }
    });
  }
  this.form.get('beneficiario.rfc')?.valueChanges.subscribe(val => {
    if (typeof val === 'string') {
      const up = val.toUpperCase().trim();
      if (val !== up) this.form.get('beneficiario.rfc')?.setValue(up, { emitEvent: false });
    }
  });
  }

  getCurrentQna(): { anio: number; qna: number; aaaaqq: number } {
    const now = new Date();
    const anio = now.getFullYear();
    const mes = now.getMonth() + 1; // 1..12
    const qnaDelMes = (now.getDate() <= 15) ? 1 : 2;   // 1a o 2a quincena del mes
    const qna = (mes - 1) * 2 + qnaDelMes;            // 1..24
    return { anio, qna, aaaaqq: anio * 100 + qna };
  }

  nextQna(aaaaqq: number): { anio: number; qna: number; aaaaqq: number } {
  let anio = Math.floor(aaaaqq / 100);
  let qna = aaaaqq % 100;  // 1..24
  qna += 1;
  if (qna > 24) { qna = 1; anio += 1; }
  return { anio, qna, aaaaqq: anio * 100 + qna };
  } 

  cancelar(): void {
    this.dialogRef.close({ cancelled: true });
  }

  cerrar(): void {
    this.dialogRef.close(true);
  }
}
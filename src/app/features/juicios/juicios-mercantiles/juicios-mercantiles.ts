import { ChangeDetectorRef, Component, ElementRef, inject, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { JuiciosMercantilesService } from '../../../core/services/juicios-mercantiles.service';
import { BeneficiarioJMRequest } from '../../../models/request/beneficiariojm-request.model';
import { Banco } from '../../../models/banco.model';
import { ApiResponse } from '../../../core/model/response/api-Response.model';
import { formatBeneficiarioJMDisplay, mapBeneficiarioJM, repartirNombre } from '../../../shared/helpers/beneficiario-jm.helper';
import { ConfirmDialog } from '../../../shared/dialogs/confirm-dialog/confirm-dialog';
import { UppercaseDirective } from "../../../shared/directives/upperCase.directivas";
import { CalendarioService } from '../../../core/services/calendario.service';
import { Calendario } from '../../../models/calendario.model';

@Component({
  selector: 'app-juicios-mercantiles',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatAutocompleteModule,
    MatCardModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatSnackBarModule,
    MatDialogModule,
    UppercaseDirective
],
  templateUrl: './juicios-mercantiles.html',
  styleUrls: ['./juicios-mercantiles.css']
})
export class JuiciosMercantiles implements OnInit, OnDestroy {

  private readonly fb = inject(FormBuilder);
  private readonly juiciosMercantilesService = inject(JuiciosMercantilesService);
  private readonly dialog = inject(MatDialog);
  private readonly zone = inject(NgZone);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cd = inject(ChangeDetectorRef);
  private readonly calendarioService = inject(CalendarioService);

  @ViewChild(MatAutocompleteTrigger) autocompleteTrigger?: MatAutocompleteTrigger;
  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>; 

  empleadoIdActual: number | null = null;
  hasCheck = false;
  resultado: BeneficiarioJMRequest[] = [];
  cargandoBusqueda = false;
  bancos: Banco[] = [];
  beneficiarios: any[] = [];
  factorDecimal = 0;
  calendarioActual: Calendario | null = null;
  cargandoQna = false;
  
 
  readonly form = this.fb.group({
      busqueda: this.fb.group({
        searchText: [null as BeneficiarioJMRequest | string |null],
        empleadoId: [null as Number | null],
        rfc: [''],
        primerApellido: [''],
        segundoApellido: [''],
        nombre: [''],
      }),
      empleado: this.fb.group({
        rfc: [''],
        primerApellido: [''],
        segundoApellido: [''],
        nombre: [''],
      }),
      beneficiario: this.fb.group({
        rfc: ['', Validators.required],
        primerApellido: [''],
        segundoApellido: [''],
        nombre: [''],
        importeTotal: [''],
        citaBancaria: [''],
        clabe: [''],
        bancoId: [''],
        formaAplicacion: [''],
        factorImporte: [''],
        estatus: [''],
        descripcion: [''],
      }),
  });

  readonly displayFn = (emp: BeneficiarioJMRequest | string | null): string => formatBeneficiarioJMDisplay(emp);


  ngOnInit(): void {
    this.loadBanks();
    this.loadQnaActiva();
  }

  ngOnDestroy() {
    this.dialog.closeAll();
  }

  private showSnack(message: string, action: string, duration: number): void {
    this.zone.runOutsideAngular(() => {
      setTimeout(() => {
        this.zone.run(() => this.snackBar.open(message, action, { duration }));
      }, 50);
    });
  }

  buscarEmpleado(): void {
    const value = this.form.get('busqueda.searchText')?.value;
    if (value && typeof value === 'object') return;

    const texto = typeof value === 'string' ? value.trim() : '';
    if (!texto) {
      this.resultado = [];
      this.autocompleteTrigger?.closePanel();
      this.showSnack('Captura un criterio de búsqueda', 'Cerrar', 4000);
      return;
    }
    if (texto.length < 3) {
      this.resultado = [];
      this.autocompleteTrigger?.closePanel();
      this.showSnack('Captura al menos 3 caracteres para buscar', 'Cerrar', 4000);
      return;
    }

    this.cargandoBusqueda = true;
    this.juiciosMercantilesService.getBuscarEmpleado(texto).subscribe({
      next: (resp: ApiResponse<BeneficiarioJMRequest[]>) => {
        const lista = resp?.data ?? [];
        this.resultado = lista.map(mapBeneficiarioJM)
          .filter(e => e.rfc.trim() || e.primerApellido.trim() || e.segundoApellido.trim() || e.nombre.trim());
        this.cargandoBusqueda = false;
       if (this.resultado.length > 0) {
  setTimeout(() => {
    this.searchInput?.nativeElement.focus(); // ← primero enfoca
    this.autocompleteTrigger?.openPanel();   // ← luego abre
  });
} else {
  this.autocompleteTrigger?.closePanel();
  this.showSnack('No se encontraron resultados', 'Cerrar', 4000);
}
      },
      error: () => {
        this.cargandoBusqueda = false;
        this.showSnack('Error en la búsqueda', 'Cerrar', 4000);
      }
    });
  }

  empleadoSeleccionado(emp: BeneficiarioJMRequest): void {
    this.empleadoIdActual = Number(emp.id);
    const partes = repartirNombre(emp);
    this.form.patchValue({
      busqueda: { empleadoId: Number(emp.id), searchText: emp },
      empleado: {
        rfc: emp.rfc ?? '',
        primerApellido: partes.primerApellido,
        segundoApellido: partes.segundoApellido,
        nombre: partes.nombre
      }
    });
    this.resultado = [];
    this.autocompleteTrigger?.closePanel();
  }

  saveBeneficiary(): void {
    if (!this.empleadoIdActual) {
      this.showSnack('Selecciona un empleado primero', 'Cerrar', 4000);
      return;
    }

    const formValue = this.form.get('beneficiario')?.value;
    const payload = {
      ...formValue,
      qnaini: this.calendarioActual ? `${this.calendarioActual.ejercicio}${this.calendarioActual.qna.toString().padStart(2, '0')}` : '',
      qnafin: '999999'
    };

    this.juiciosMercantilesService.saveBeneficiary(payload, this.empleadoIdActual)
      .subscribe({
        next: () => {
          this.form.get('beneficiario')?.reset();
          this.clearFilters();
          this.dialog.open(ConfirmDialog, {
            width: '420px',
            data: {
              title: 'Registro exitoso',
              message: 'El juicio fue guardado con exito',
              confirmText: 'Aceptar',
              type: 'info'
            }
          });
        },
        error: (err) => {
          console.error(err);
          this.dialog.open(ConfirmDialog, {
            width: '420px',
            data: {
              title: 'Error',
              message: 'Ocurrio un error al guardar el juicio. Intenta nuevamente',
              confirmText: 'Cerrar',
              type: 'danger'
            }
          });
        }
      });
  }

  loadBanks(): void {
    this.juiciosMercantilesService.getBancos().subscribe({
      next: (response: ApiResponse<Banco[]>) => {
        this.bancos = response.data ?? [];
      },
      error: (err) => {
        this.showSnack('Error al cargar bancos', 'Cerrar', 4000);
      }
    });
  }

 loadQnaActiva(): void {
    this.cargandoQna = true;
    this.calendarioService.getQnaActiva().subscribe({
      next: (response: ApiResponse<Calendario>) => {
        this.calendarioActual = response.data ?? null;
        this.cargandoQna      = false;
      },
      error: () => {
        this.cargandoQna = false;
        this.showSnack('Error al cargar QNA activa', 'Cerrar', 4000);
      }
    });
  }

  clearFilters(): void {
    this.form.patchValue({
      busqueda: { searchText: '', empleadoId: null, rfc: '', primerApellido: '', segundoApellido: '', nombre: '' },
      empleado: { rfc: '', primerApellido: '', segundoApellido: '', nombre: '' }
    }, { emitEvent: false });
    this.resultado = [];
    this.autocompleteTrigger?.closePanel();
    this.beneficiarios = [];
    this.empleadoIdActual = null;
    this.hasCheck = false;
    this.cd.markForCheck();
  }
}
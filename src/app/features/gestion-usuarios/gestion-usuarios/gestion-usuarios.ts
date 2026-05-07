import { ChangeDetectorRef, Component, NgZone, ViewChild } from '@angular/core';
import { AssignRoleRequest, EmpleadoItem, Role } from '../../../models/emplado.model';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TerceroService } from '../../../core/services/tercero.service';
import { NominaRow } from '../../../models/nomina-Row.model';
import { MatTableDataSource } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { UppercaseDirective } from '../../../shared/directives/upperCase.directivas';
import { MatPaginator } from '@angular/material/paginator';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-gestion-usuarios',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatCheckboxModule,
    MatSelectModule,
    UppercaseDirective 
  ],
  templateUrl: './gestion-usuarios.html',
  styleUrl: './gestion-usuarios.css'
})
export class GestionUsuarios {

  @ViewChild(MatAutocompleteTrigger) autocompleteTrigger?: MatAutocompleteTrigger;
  @ViewChild(MatPaginator) paginator?: MatPaginator;

  form!: FormGroup;
  resultado: EmpleadoItem[] = [];
  cargandoBusqueda = false;
  empleadoActual: EmpleadoItem | null = null;
  dataSource = new MatTableDataSource<NominaRow>([]);
  totalElements = 0;

  
  empleados: EmpleadoItem[] = [];
  roles: Role[] = [];
  selectedUserId!: number;
  selectedRoles: number[] = [];
  loading = false;

  constructor(private terceroService: TerceroService, private fb: FormBuilder, private snackBar: MatSnackBar, private zone: NgZone, private cd: ChangeDetectorRef,) {}

  ngOnInit() {
    this.form = this.fb.group({ 
      busqueda: this.fb.group({
        searchText: [''],
      }), 
    });
    this.loadRoles();
  }

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
  
      const texto = typeof value === 'string' ? value.trim() : '';
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
      this.terceroService.searchEmployees(texto).subscribe({
        next: (lista: EmpleadoItem[]) => {
          this.resultado = (lista ?? []).filter(e => {
            const rfc = (e.rfc ?? e.RFC ?? '').trim();
            const curp = (e.curp ?? e.CURP ?? '').trim();
            const pa = (e.primerApellido ?? e.primer_apellido ?? '').trim();
            const sa = (e.segundoApellido ?? e.segundo_apellido ?? '').trim();
            const nombre = (e.nombre ?? '').trim();
            const empleadoStr = (e.empleado ?? '').trim();
            const nombreCompleto = (e.nombreCompleto ?? '').trim();
  
            return !!(rfc || curp || pa || sa || nombre || empleadoStr || nombreCompleto);
          });
  
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

  empleadoSeleccionado(emp: EmpleadoItem): void {
      let rfc = (emp.rfc ?? emp.RFC ?? '').trim();
      let curp = (emp.curp ?? emp.CURP ?? '').trim();
      let nombre = (emp.nombreCompleto ?? '').trim();

        if (!nombre) {
          const fullName = [
            emp.primerApellido ?? emp.primer_apellido ?? '',
            emp.segundoApellido ?? emp.segundo_apellido ?? '',
            emp.nombre ?? ''
          ].map(x => x.trim()).filter(Boolean).join(' ');
          nombre = fullName.trim();
        }

      const empleadoStr = (emp.empleado ?? '').trim();
        if (empleadoStr) {
          const parts = empleadoStr.split(' - ').map(p => p.trim());
          if (!rfc && parts.length >= 1) rfc = parts[0] ?? '';
          if (!curp && parts.length >= 2) curp = parts[1] ?? '';
          if (!nombre && parts.length >= 3) nombre = parts.slice(2).join(' - ').trim();
        }

      const row: any = {
        rfc,
        curp,
        nombreEmpleado: nombre
      };

      
      this.empleadoActual = emp;
      this.dataSource.data = [row];
      this.totalElements = 1;
      this.resultado = [];
      this.autocompleteTrigger?.closePanel();
  }

  displayEmpleado(emp: EmpleadoItem | string | null): string {
      if (!emp) return '';
      if (typeof emp === 'string') return emp;

      const rfc = (emp.rfc ?? emp.RFC ?? '').trim();

      const fullName = [
        emp.primerApellido ?? emp.primer_apellido ?? '',
        emp.segundoApellido ?? emp.segundo_apellido ?? '',
        emp.nombre ?? ''
      ].map(x => x.trim()).filter(Boolean).join(' ');

      const etiqueta = (emp.nombreCompleto ?? '').trim() || fullName || (emp.empleado ?? '').trim();
      return [rfc, etiqueta].filter(Boolean).join(' - ');
  }

  // consumir endpoint de roles
  loadRoles(): void {
    this.terceroService.getRoles().subscribe({
    next: (data: Role[]) => {
      this.roles = data;
    },
    error: (err) => {
      console.error('Error cargando roles', err);
    }
  });
  }

  onRoleChange(event: any, roleId: number): void {
    if (event.checked) {
      this.selectedRoles.push(roleId);
    } else {
      this.selectedRoles =
        this.selectedRoles.filter(id => id !== roleId);
    }
  }

  asignarRoles(): void {
    if (!this.empleadoActual?.id) return;
    const request: AssignRoleRequest = {
      userId: this.empleadoActual.id,
      roleIds: this.selectedRoles
    };

    this.loading = true;
    this.terceroService.getRoles().subscribe({
      next: (res) => {
        console.log('Roles asignados', res);
        this.selectedRoles = [];
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
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
        nombre: '',
        concepto: null,
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
      this.dataSource.data = [];
      this.totalElements = 0;
      this.paginator?.firstPage?.();
      this.cd.markForCheck();
  }


}

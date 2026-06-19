import { ChangeDetectorRef, Component, inject, NgZone, ViewChild } from '@angular/core';
import { EmpleadoItem } from '../../../models/emplado.model';
import { Role } from '../../../models/rol.model';
import { AssignRoleRequest } from '../../../models/request/assignrole-request.model';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';;
import { NominaRow } from '../../../models/nomina-Row.model';
import { MatTableDataSource } from '@angular/material/table';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { UppercaseDirective } from '../../../shared/directives/upperCase.directivas';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { UserService } from '../../../core/services/user.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { UsuarioDialog } from '../../../shared/dialogs/usuario-dialog/usuario-dialog';
import { PensionAlimenDialog } from '../../pension-alimenticia/pension-alimen-dialog/pension-alimen-dialog';
import { AltaUsuarioDialog } from '../../../shared/dialogs/alta-usuario-dialog/alta-usuario-dialog';
import { ConfirmDialog } from '../../../shared/dialogs/confirm-dialog/confirm-dialog';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';

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
    MatSnackBarModule,
    MatTableModule,
    MatPaginatorModule,
    MatCheckboxModule,
    MatSelectModule,
    MatDialogModule,
    MatSortModule,
    UppercaseDirective
  ],
  templateUrl: './gestion-usuarios.html',
  styleUrl: './gestion-usuarios.css'
})
export class GestionUsuarios {


  @ViewChild(MatSort) sort?: MatSort;
  @ViewChild(MatAutocompleteTrigger) autocompleteTrigger?: MatAutocompleteTrigger;
  @ViewChild(MatPaginator) paginator?: MatPaginator;

  form!: FormGroup;
  resultado: EmpleadoItem[] = [];
  cargandoBusqueda = false;
  empleadoActual: EmpleadoItem | null = null;
  dataSource = new MatTableDataSource<NominaRow>([]);
  totalElements = 0;

  usersDataSource = new MatTableDataSource<EmpleadoItem>([]);
  displayedColumns: string[] = ['id', 'nombreCompleto', 'empleado', 'roles', 'padre', 'hijo', 'acciones'];


  empleados: EmpleadoItem[] = [];
  roles: Role[] = [];
  selectedUserId!: number;
  selectedRoles: number[] = [];
  empleadoRolesIds: number[] = [];
  loading = false;

  allUsers: EmpleadoItem[] = [];
  totalUsers = 0;
  pageSize = 10;
  pageIndex = 0;
  activeSort: Sort = { active: 'id', direction: 'asc' };

  private readonly userService = inject(UserService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly zone = inject(NgZone);
  private readonly cd = inject(ChangeDetectorRef);
  private readonly dialog = inject(MatDialog);

  ngOnInit() {
    this.form = this.fb.group({
      busqueda: this.fb.group({
        searchText: [''],
      }),
    });
    this.loadRoles();
    this.loadEmpleados();
  }

 onSortChange(sort: Sort): void {
  this.activeSort = sort.direction ? sort : { active: 'id', direction: 'desc' };
  this.pageIndex = 0;
  this.applyTableState();
}

onPageChange(event: PageEvent): void {
  this.pageIndex = event.pageIndex;
  this.pageSize = event.pageSize;
  this.applyTableState();
}

private applyTableState(): void {
  const sorted = [...this.allUsers].sort((a, b) => {
    const dir = this.activeSort.direction === 'asc' ? 1 : -1;
    const va = this.getSortValue(a, this.activeSort.active);
    const vb = this.getSortValue(b, this.activeSort.active);
    if (va < vb) return -1 * dir;
    if (va > vb) return 1 * dir;
    return 0;
  });
  const start = this.pageIndex * this.pageSize;
  const end = start + this.pageSize;
  this.usersDataSource.data = sorted.slice(start, end);
}

private getSortValue(row: EmpleadoItem, column: string): string | number {
  switch (column) {
    case 'id': return row.id ?? 0;
    case 'nombreCompleto': return (row.nombreCompleto ?? '').toLowerCase();
    case 'empleado': return (row.empleado ?? '').toLowerCase();
    case 'rolesName': return (row.rolesName ?? row.rolesname ?? '').toLowerCase();
    case 'parentModulesName': return (row.parentModulesName ?? row.parentmodulesname ?? '').toLowerCase();
    case 'childModulesName': return (row.childModulesName ?? row.childmodulesname ?? '').toLowerCase();
    default: return '';
  }
}

  openAltaUsuarioDialog(): void {
    const ref = this.dialog.open(AltaUsuarioDialog, {
      width: '850px',
      maxWidth: '95vw',
      autoFocus: false,
      data: {
        roles: this.roles,
      }
    });

    ref.afterClosed().subscribe(payload => {
      if (!payload) return;

      this.loading = true;
      this.userService.createUser(payload).subscribe({
        next: () => {
          this.loading = false;
          this.loadEmpleados();
          this.dialog.open(PensionAlimenDialog, {
            width: '420px',
            data: {
              type: 'success',
              message: 'Se creó correctamente el usuario.'
            }
          });
        },
        error: (err) => {
          this.loading = false;
          this.dialog.open(PensionAlimenDialog, {
            width: '420px',
            data: {
              type: 'error',
              message: 'Ocurrió un error al crear el usuario.'
            }
          });
          console.error(err);
        }
      });
    });
  }

  ngAfterViewInit() {
    // NO conectar paginator/sort integrado - usamos paginación manual
  }

  private showSnack(message: string, action: string, duration: number): void {
    this.zone.runOutsideAngular(() => {
      setTimeout(() => {
        this.zone.run(() => this.snackBar.open(message, action, { duration }));
      }, 50);
    });
  }

  // consumir endpoint de roles
  loadRoles(): void {
    this.userService.getRoles().subscribe({
    next: (data: Role[]) => {
      this.roles = data;
    },
    error: (err) => {
      console.error('Error cargando roles', err);
    }
  });
  }

  loadEmpleados(): void {
    this.userService.getAllUsers().subscribe({
      next: (data: EmpleadoItem[]) => {
        const lista: any[] = (data as any) ?? [];
        this.empleados = lista.map((u: any) => {
          const username = (u?.username ?? '').toString().trim();
          const email = (u?.email ?? '').toString().trim();
          const area = (u?.area ?? '').toString().trim();
          const catEmpleadoId = u?.catEmpleadoId;

          const etiqueta = username || email || area || (catEmpleadoId != null ? String(catEmpleadoId) : '');

          return {
            id: u?.id,
            rfc: u?.rfc ?? u?.RFC,
            curp: u?.curp ?? u?.CURP,
            empleado: etiqueta,
            nombreCompleto: u?.nombreCompleto ?? etiqueta,
            rolesName: u?.rolesName ?? u?.rolesname,
            modulesName: u?.modulesName ?? u?.modulesname,
            parentModulesName: u?.parentModulesName ?? u?.parentmodulesname,
            childModulesName: u?.childModulesName ?? u?.childmodulesname,
            raw: u,
          } as EmpleadoItem;
        });

        // Llenar allUsers para paginación manual
        this.allUsers = this.empleados;
        this.totalUsers = this.allUsers.length;
        this.pageIndex = 0;
        this.applyTableState();
        this.cd.markForCheck();
      },
      error: (err) => {
        console.error('Error cargando usuarios', err);
      }
    });
  }

  getUserRoles(row: EmpleadoItem): string[] {
    return this.splitList(row.rolesName ?? row.rolesname ?? '');
  }

  getUserModules(row: EmpleadoItem): string[] {
    return this.splitList(row.modulesName ?? row.modulesname ?? '');
  }

  getUserParentModules(row: EmpleadoItem): string[] {
    return this.splitList(row.parentModulesName ?? row.parentmodulesname ?? '');
  }

  getUserChildModules(row: EmpleadoItem): string[] {
    return this.splitList(row.childModulesName ?? row.childmodulesname ?? '');
  }

  private splitList(value: string): string[] {
    return value.split(',').map(item => item.trim()).filter(item => !!item);
  }

  buscarUsuario(): void {
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

    const q = texto.toLowerCase();
    const filtrados = (this.empleados ?? []).filter(e => {
      const rfc = (e.rfc ?? e.RFC ?? '').trim().toLowerCase();
      const curp = (e.curp ?? e.CURP ?? '').trim().toLowerCase();
      const pa = (e.primerApellido ?? e.primer_apellido ?? '').trim().toLowerCase();
      const sa = (e.segundoApellido ?? e.segundo_apellido ?? '').trim().toLowerCase();
      const nombre = (e.nombre ?? '').trim().toLowerCase();
      const empleadoStr = (e.empleado ?? '').trim().toLowerCase();
      const nombreCompleto = (e.nombreCompleto ?? '').trim().toLowerCase();

      return (
        rfc.includes(q) ||
        curp.includes(q) ||
        pa.includes(q) ||
        sa.includes(q) ||
        nombre.includes(q) ||
        empleadoStr.includes(q) ||
        nombreCompleto.includes(q)
      );
    });

    setTimeout(() => {
      this.resultado = filtrados;
      this.cargandoBusqueda = false;

      // Llenar allUsers con filtrados para paginación manual
      this.allUsers = filtrados;
      this.totalUsers = this.allUsers.length;
      this.pageIndex = 0;
      this.applyTableState();

      if (this.resultado.length > 0) {
        this.autocompleteTrigger?.openPanel();
      } else {
        this.autocompleteTrigger?.closePanel();
      }
      this.cd.markForCheck();
    }, 0);
  }

  usuarioSeleccionado(emp: EmpleadoItem): void {
    this.empleadoActual = emp;
    this.selectedRoles = [];
    this.empleadoRolesIds = [];
    this.resultado = [];
    this.autocompleteTrigger?.closePanel();

    this.form.patchValue({
      busqueda: {
        searchText: emp
      }
    }, { emitEvent: false });

    this.cd.markForCheck();
  }

  openUsuarioDialog(row: EmpleadoItem): void {
    this.usuarioSeleccionado(row);
    const user = (row as any)?.raw ?? row;

    const ref = this.dialog.open(UsuarioDialog, {
      width: '1200px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      autoFocus: false,
      data: {
        user,
        roles: this.roles,
        selectedRoleIds: this.empleadoRolesIds ?? []
      }
    });

    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.loading = true;
      this.userService.updateUser(row.id!, result.userPatch).subscribe({
        next: () => {
          this.loading = false;
          this.loadEmpleados();
          this.dialog.open(PensionAlimenDialog, {
            width: '420px',
            data: {
              type: 'success',
              message: 'Se actualizó correctamente el usuario.'
            }
          });
        },
        error: (err) => {
          this.loading = false;
          this.dialog.open(PensionAlimenDialog, {
            width: '420px',
            data: {
              type: 'error',
              message: 'Ocurrió un error al actualizar el usuario.'
            }
          });
          console.error(err);
        }
      });
    });
  }

  deleteUser(row: EmpleadoItem): void {
    const userId = row?.id;
    if (userId == null) {
      this.dialog.open(PensionAlimenDialog, {
        width: '420px',
        data: {
          type: 'error',
          message: 'No se encontró el id del usuario.'
        }
      });
      return;
    }

    const etiqueta = (row?.nombreCompleto ?? row?.empleado ?? '').toString().trim();

    const confirmRef = this.dialog.open(ConfirmDialog, {
      width: '500px',
      autoFocus: false,
      data: {
        title: 'Eliminar usuario',
        message: `¿Seguro que deseas eliminar este usuario${etiqueta ? `: ${etiqueta}` : ''}?`,
        confirmText: 'Aceptar',
        cancelText: 'Cancelar',
        type: 'danger'
      }
    });

    confirmRef.afterClosed().subscribe((ok: boolean) => {
      if (!ok) return;

      this.loading = true;
      this.userService.softDeleteUser(userId).subscribe({
        next: () => {
          this.loading = false;
          this.loadEmpleados();
          this.dialog.open(PensionAlimenDialog, {
            width: '500px',
            data: {
              type: 'success',
              message: 'Se eliminó correctamente el usuario.'
            }
          });
        },
        error: (err) => {
          this.loading = false;
          this.dialog.open(PensionAlimenDialog, {
            width: '500px',
            data: {
              type: 'error',
              message: 'Ocurrió un error al eliminar el usuario.'
            }
          });
          console.error(err);
        }
      });
    });
  }

  displayUsuario(emp: EmpleadoItem | string | null): string {
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


  asignarRoles(userId: number, roleIds: number[]): void {
    const request: AssignRoleRequest = { userId, roleIds };
    this.loading = true;

    this.userService.assignRoles(request.userId, request.roleIds).subscribe({
      next: () => {
        this.loading = false;

        this.dialog.open(PensionAlimenDialog, {
          width: '420px',
          data: {
            type: 'success',
            message: 'Se guardó correctamente tus datos.'
          }
        });
      },
      error: (err) => {
        this.loading = false;

        this.dialog.open(PensionAlimenDialog, {
          width: '420px',
          data: {
            type: 'error',
            message: 'Ocurrió un error al guardar.'
          }
        });

        console.error(err);
      }
    });
  }

  clearFilters(): void {
    this.form.patchValue({
      busqueda: {
        searchText: '',
      }
    }, { emitEvent: false });

    this.resultado = [];
    this.empleadoActual = null;
    this.selectedRoles = [];
    
    // Restaurar allUsers desde empleados originales
    this.allUsers = [...this.empleados];
    this.totalUsers = this.allUsers.length;
    this.pageIndex = 0;
    this.applyTableState();
    
    this.autocompleteTrigger?.closePanel();
    this.cd.markForCheck();
  }
}

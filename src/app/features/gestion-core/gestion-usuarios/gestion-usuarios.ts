import { ChangeDetectorRef, Component, inject, OnDestroy, ViewChild } from '@angular/core';
import { EmpleadoItem } from '../../../core/model/emplado.model';
import { Role } from '../../../core/model/rol.model';
import { AssignRoleRequest } from '../../../core/model/request/assignrole-request.model';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { NominaRow } from '../../../core/model/nomina-Row.model';
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
import { UsuarioDialog } from '../../../shared/dialogs/editar-usuario-dialog/editar-usuario-dialog';
import { AltaUsuarioDialog } from '../../../shared/dialogs/alta-usuario-dialog/alta-usuario-dialog';
import { ConfirmDialog } from '../../../shared/dialogs/confirm-dialog/confirm-dialog';
import { ToastService } from '../../../core/services/toast.service';
import { User } from '../../../core/model/user.model';

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
    MatTableModule,
    MatPaginatorModule,
    MatCheckboxModule,
    MatSelectModule,
    MatDialogModule,
    UppercaseDirective
  ],
  templateUrl: './gestion-usuarios.html',
  styleUrl: './gestion-usuarios.css'
})
export class GestionUsuarios implements OnDestroy {

  private readonly userService = inject(UserService);
  private readonly fb = inject(FormBuilder);
  private readonly cd = inject(ChangeDetectorRef);
  private readonly dialog = inject(MatDialog);
  private readonly toastService = inject(ToastService);

  @ViewChild(MatAutocompleteTrigger) autocompleteTrigger?: MatAutocompleteTrigger;
  @ViewChild(MatPaginator) paginator?: MatPaginator;

  form!: FormGroup;
  resultado: User[] = [];
  cargandoBusqueda = false;
  empleadoActual: EmpleadoItem | null = null;
  empleados: User[] = [];
  roles: Role[] = [];
  allUsers: User[] = [];
  selectedUserId!: number;
  selectedRoles: number[] = [];
  empleadoRolesIds: number[] = [];
  loading = false;
  totalUsers = 0;
  pageSize = 10;
  pageIndex = 0;
  totalElements = 0;

  dataSource = new MatTableDataSource<NominaRow>([]);
  usersDataSource = new MatTableDataSource<User>([]);
  displayedColumns: string[] = [
    'nombreCompleto', 
    'empleado', 
    'area',
    'roles', 
    'padre', 
    'hijo', 
    'acciones'
  ];

  ngOnInit() {
    this.form = this.fb.group({
      busqueda: this.fb.group({
        searchText: [''],
      }),
    });
    this.loadRoles();
    this.loadEmpleados();
  }

  ngOnDestroy () {
    this.dialog.closeAll();
  }

  displayUsuario(user: User | string | null): string {
    if (!user) return '';
      if (typeof user === 'string') {
        return user;
      }
    return user.username || user.email || '';
  }

  loadRoles(): void {
    this.userService.getRoles().subscribe({
      next: (data: Role[]) => {
        this.roles = data;
      },
      error: () => {
        this.toastService.error('Error', 'No se pudo obtener la carga de roles.',6000);
      }
    });
  }

  loadEmpleados(): void {
    this.userService.getAllUsers().subscribe({
      next: (data: User[]) => {
        this.empleados = data;
        this.allUsers = data;
        this.totalUsers = this.allUsers.length;
        this.pageIndex = 0;
        this.applyTableState();
        this.cd.markForCheck();
      },
      error: () => {
        this.toastService.error('Operación invalida', 'Error no se cargaron los usuarios', 6000);
      }
    });
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
          this.toastService.info(
            'Éxito', 
            'Usuario creado correctamente', 
            6000
          );
        },
        error: () => {
          this.loading = false;
          this.toastService.info(
            'Error', 
            'Ocurrió un error al crear el usuario.', 
            6000
          );
        }
      });
    });
  }

  buscarUsuario(): void {
    const value = this.form.get('busqueda.searchText')?.value;
    if (value && typeof value === 'object') {
      return;
    }
    const texto = typeof value === 'string' ? value.trim() : '';
    if (!texto) {
      this.resultado = [];
      this.autocompleteTrigger?.closePanel();
      this.toastService.warning('Referencia de búsqueda', 'Captura un criterio de búsqueda.', 6000);
      return;
    }

    if (texto.length < 3) {
      this.resultado = [];
      this.autocompleteTrigger?.closePanel();
      this.toastService.warning('Referencia de búsqueda', 'Captura al menos 3 caracteres para buscar.', 6000);
      return;
    }
    const q = texto.toLowerCase();
    const filtrados = (this.empleados ?? []).filter(user => {
      const username = (user.username ?? '').trim().toLowerCase();
      const email = (user.email ?? '').trim().toLowerCase();
      const area = (user.area ?? '').trim().toLowerCase();
      const task = (user.task ?? '').trim().toLowerCase();
      const catEmpleadoId = String(user.catEmpleadoId ?? '').toLowerCase();

      return (
        username.includes(q) ||
        email.includes(q) ||
        area.includes(q) ||
        task.includes(q) ||
        catEmpleadoId.includes(q)
      );
    });
    this.resultado = filtrados;
    this.pageIndex = 0;
    if (filtrados.length > 0) {
      this.allUsers = filtrados;
      this.totalUsers = filtrados.length;
      this.applyTableState();
      this.autocompleteTrigger?.openPanel();
    } else {
      this.allUsers = [];
      this.totalUsers = 0;
      this.usersDataSource.data = [];
      this.autocompleteTrigger?.closePanel();
      this.toastService.warning('Usuario no encontrado','Escribe un usuario existente para realizar la búsqueda.', 6000);
    }
    this.cd.markForCheck();
  }

  usuarioSeleccionado(user: User): void {
    this.empleadoActual = user;
    this.selectedRoles = [];
    this.empleadoRolesIds = [];
    this.resultado = [];
    this.autocompleteTrigger?.closePanel();
    this.form.patchValue({
      busqueda: {
        searchText: user
      }
    }, { emitEvent: false });

    this.cd.markForCheck();
  }

  openUsuarioDialog(row: User): void {
    this.usuarioSeleccionado(row);
    const user = row;
    this.userService.getRolesByUser(row.id).subscribe({
      next: (roleIds) => {
        this.empleadoRolesIds = roleIds;
        const ref = this.dialog.open(UsuarioDialog, {
          width: '1200px',
          maxWidth: '95vw',
          maxHeight: '90vh',
          autoFocus: false,
          data: {
            user,
            roles: this.roles,
            selectedRoleIds: this.empleadoRolesIds
          }
        });

        ref.afterClosed().subscribe(result => {
          if (!result) return;
          this.loading = true;
          this.userService.updateUser(row.id!, result.userPatch).subscribe({
            next: () => {
              this.loading = false;
              this.loadEmpleados();
              this.toastService.info('Operación exitosa', 'Se actualizó correctamente el usuario.', 6000);
            },
            error: () => {
              this.loading = false;
              this.toastService.error('Operación invalida', 'Ocurrió un error al actualizar el usuario. Intente nuevamente.', 6000);
            }
          });
        });
      },
      error: () => {
        this.toastService.error('Error', 'No se pudieron cargar los roles del usuario.', 6000);
      }
    });
  }

  deleteUser(row: User): void {
    const userId = row?.id;
    if (userId == null) {
      this.toastService.error('Operación invalida', 'No se encontro el id del usuario', 6000);
      return;
    }

    const etiqueta = (row.username|| row.email || String(row.catEmpleadoId)).trim();
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
          this.toastService.info('Operación correcta', 'Se eliminó correctamente el usuario.', 6000);
        },
        error: (err) => {
          this.loading = false;
          this.toastService.error('Operación invalida', 'Ocurrió un error al eliminar el usuario.', 6000);
        }
      });
    });
  }

  asignarRoles(userId: number, roleIds: number[]): void {
    const request: AssignRoleRequest = { userId, roleIds };
    this.loading = true;
    this.userService.assignRoles(request.userId, request.roleIds).subscribe({
      next: () => {
        this.loading = false;
        this.toastService.info('Operación exitosa', 'Se guardó correctamente tus datos.', 6000);
      },
      error: () => {
        this.loading = false;
        this.toastService.error('Operación invalida', 'Ocurrió un error al guardar.', 6000);
      }
    });
  }

  clearFilters(): void {
    this.form.patchValue({
      busqueda: {
        searchText: '',
      }
    }, { emitEvent: false });
    this.resultado =[];
    this.empleadoActual = null;
    this.selectedRoles = [];
    this.loadEmpleados();
    this.totalUsers = this.allUsers.length;
    this.pageIndex = 0;
    this.applyTableState();
    this.autocompleteTrigger?.closePanel();
    this.cd.markForCheck();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.applyTableState();
  }

  private applyTableState(): void {
    const start = this.pageIndex * this.pageSize;
    const end = start + this.pageSize;
    this.usersDataSource.data = this.allUsers.slice(start, end);
  }

  getUserRoles(row: User): string[] {
    return this.splitList(row.rolesname ?? '');
  }

  getUserModules(row: User): string[] {
    return this.splitList(row.modulesName ?? '');
  }

  getUserParentModules(row: User): string[] {
    return this.splitList(row.parentmodulesname ?? '');
  }

  getUserChildModules(row: User): string[] {
    return this.splitList(row.childmodulesname ?? '');
  }

  private splitList(value: string): string[] {
    return value.split(',').map(item => item.trim()).filter(item => !!item);
  }
}

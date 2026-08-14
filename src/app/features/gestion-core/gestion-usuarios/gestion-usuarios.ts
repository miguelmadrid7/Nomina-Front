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
  resultado: EmpleadoItem[] = [];
  cargandoBusqueda = false;
  empleadoActual: EmpleadoItem | null = null;
  dataSource = new MatTableDataSource<NominaRow>([]);
  totalElements = 0;

  usersDataSource = new MatTableDataSource<EmpleadoItem>([]);
  displayedColumns: string[] = ['nombreCompleto', 'empleado', 'roles', 'padre', 'hijo', 'acciones'];


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
          this.toastService.info('Éxito', 'Usuario creado correctamente', 6000);
        },
        error: () => {
          this.loading = false;
          this.toastService.info('Error', 'Ocurrió un error al crear el usuario.', 6000);
        }
      });
    });
  }

  loadRoles(): void {
    this.userService.getRoles().subscribe({
      next: (data: Role[]) => {
        this.roles = data;
      },
      error: () => {
        this.toastService.error('Error', 'No se pudo obtener la carga de roles.', 6000);
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
        this.allUsers = this.empleados;
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
      this.toastService.warning('Referencia de búsqueda', 'Captura un criterio de búsqueda.', 6000);
      return;
    }
    if (texto.length < 3) {
      this.resultado = [];
      this.autocompleteTrigger?.closePanel();
      this.toastService.warning('Referencia de búsqueda', 'Captura almenos 3 caractares para buscar.', 6000);
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
          this.toastService.info('Operación exitosa', 'Se actualizó correctamente el usuario.', 6000);
        },
        error: () => {
          this.loading = false;
          this.toastService.error('Operación invalida', 'Ocurrió un error al actualizar el usuario. Intente nuevamente.', 6000);
        }
      });
    });
  }

  deleteUser(row: EmpleadoItem): void {
    const userId = row?.id;
    if (userId == null) {
      this.toastService.error('Operación invalida', 'No se encontro el id del usuario', 6000);
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
    this.resultado = [];
    this.empleadoActual = null;
    this.selectedRoles = [];
    this.allUsers = [...this.empleados];
    this.totalUsers = this.allUsers.length;
    this.pageIndex = 0;
    this.applyTableState();
    this.autocompleteTrigger?.closePanel();
    this.cd.markForCheck();
  }
}

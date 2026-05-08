import { ChangeDetectorRef, Component, NgZone, ViewChild } from '@angular/core';
import { AssignRoleRequest, EmpleadoItem, Role } from '../../../models/emplado.model';
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
import { MatPaginator } from '@angular/material/paginator';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { UserService } from '../../../core/services/user.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { UsuarioDialog } from '../../../shared/dialogs/usuario-dialog/usuario-dialog';
import { PensionAlimenDialog } from '../../nomina/pension-alimen-dialog/pension-alimen-dialog';
import { AltaUsuarioDialog } from '../../../shared/dialogs/alta-usuario-dialog/alta-usuario-dialog';
import { ConfirmDialog } from '../../../shared/dialogs/confirm-dialog/confirm-dialog';

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

  usersDataSource = new MatTableDataSource<EmpleadoItem>([]);
  displayedColumns: string[] = ['id', 'nombreCompleto', 'empleado', 'acciones'];


  empleados: EmpleadoItem[] = [];
  roles: Role[] = [];
  selectedUserId!: number;
  selectedRoles: number[] = [];
  empleadoRolesIds: number[] = [];
  loading = false;

  constructor(
    private userService: UserService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private zone: NgZone,
    private cd: ChangeDetectorRef,
    private dialog: MatDialog,
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      busqueda: this.fb.group({
        searchText: [''],
      }),
    });
    this.loadRoles();
    this.loadEmpleados();
  }

  openAltaUsuarioDialog(): void {
    const ref = this.dialog.open(AltaUsuarioDialog, {
      width: '900px',
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
    if (this.paginator) {
      this.usersDataSource.paginator = this.paginator;
    }
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
            raw: u,
          } as EmpleadoItem;
        });

        this.usersDataSource = new MatTableDataSource<EmpleadoItem>(this.empleados);
        if (this.paginator) {
          this.usersDataSource.paginator = this.paginator;
        }
        this.totalElements = this.empleados.length;
        this.cd.markForCheck();
      },
      error: (err) => {
        console.error('Error cargando usuarios', err);
      }
    });
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

      this.usersDataSource = new MatTableDataSource<EmpleadoItem>(filtrados);
      if (this.paginator) {
        this.usersDataSource.paginator = this.paginator;
      }
      this.totalElements = filtrados.length;

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
      const roleIds = result.selectedRoleIds as number[];
      this.asignarRoles(row.id!, roleIds);
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
    this.usersDataSource = new MatTableDataSource<EmpleadoItem>(this.empleados);
    if (this.paginator) {
      this.usersDataSource.paginator = this.paginator;
    }
    this.totalElements = this.empleados.length;
    this.autocompleteTrigger?.closePanel();
    this.dataSource.data = [];
    this.paginator?.firstPage?.();
    this.cd.markForCheck();
  }


}

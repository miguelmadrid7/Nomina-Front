import { Component, inject, OnDestroy, ViewChild } from '@angular/core';
import { Role } from '../../../core/model/rol.model';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { RolService } from '../../../core/services/rol.service';
import { MatIconModule } from '@angular/material/icon';
import { AltaRolDialog } from '../../../shared/dialogs/alta-rol-dialog/alta-rol-dialog';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialog } from '../../../shared/dialogs/confirm-dialog/confirm-dialog';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-gestion-role-usuarios',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatPaginatorModule,
    MatTableModule,
    MatIconModule,
    MatDialogModule,
  ],
  templateUrl: './gestion-role.html',
  styleUrl: './gestion-role.css'
})
export class GestionRole implements OnDestroy {


  @ViewChild(MatPaginator) paginator?: MatPaginator
  dataSource  = new MatTableDataSource<Role>([]);
  roles: Role[] = [];
  displayedColumns: string[] = ['rol', 'padre', 'acciones'];
  totalRoles = 0;
  pageSize = 10;
  pageIndex = 0;

  loading = false;

  private readonly rolService = inject(RolService);
  private readonly dialog = inject(MatDialog);
  private readonly toastService = inject(ToastService);


  ngOnInit(): void {
     this.loadRoles();
  }

  ngOnDestroy(): void {
    this.dialog.closeAll();
  }

  loadRoles(): void {
    this.loading = true;
    this.rolService.getRoles().subscribe({
      next: (roles: Role[]) => {
        this.roles = roles;
        this.totalRoles = roles.length;
        this.pageIndex = 0;
        this.applyTableState();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toastService.error('Error', 'No se pudieron cargar correctamente los roles. Intente nuevamente.', 6000);
      },
    });
  }

  onPageChange(event: { pageIndex: number; pageSize: number }): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.applyTableState();
  }

  private applyTableState(): void {
    const start = this.pageIndex * this.pageSize;
    const end = start + this.pageSize;
    this.dataSource.data = this.roles.slice(start, end);   
  }

  getRoleModules(row: Role): string[] {
    const modules = row.modulesName ?? row.modulesname ?? '';
    return modules
      .split(',')
      .map(module => module.trim())
      .filter(module => !!module);
  }

  openAltaRoleDialog(): void {
    const ref = this.dialog.open(AltaRolDialog, {
      width: '750px',
      maxWidth: '95vw',
      autoFocus: false,
    });

    ref.afterClosed().subscribe((payload) => {
      if (!payload) return;
      this.loading = true;
      this.rolService.createRole(payload).subscribe({
        next: () => {
          this.loading = false;
          this.toastService.info('Operación exitosa', 'Rol creado correctamente.', 6000);
          this.loadRoles();
        },
        error: () => {
          this.loading = false;
          this.toastService.error('Error', 'No se pudo crear el rol. Intenta nuevamente.', 6000);
        },
      });
    });
  }

  openEditRoleDialog(role: Role): void {
    this.loading = true;
    this.rolService.getRole(role.id).subscribe({
      next: (roleDetail) => {
        this.loading = false;
        const ref = this.dialog.open(AltaRolDialog, {
          width: '600px',
          maxWidth: '95vw',
          autoFocus: false,
          data: roleDetail
        });

        ref.afterClosed().subscribe((payload) => {
          if (!payload) return;

          this.loading = true;

          this.rolService.updateRole(role.id, payload).subscribe({
            next: () => {
              this.loading = false;
              this.toastService.info('Operación exitosa', 'Rol actualizado correctamente.', 6000);
              this.loadRoles();
            },
            error: () => {
              this.loading = false;
              this.toastService.error('Error', 'No se pudo actulizar correctamente el rol', 6000);
            }
          });
        });
      },
      error: () => {
        this.loading = false;
        this.toastService.error('Error', 'No se pudo cargar el detalle del rol', 6000);
      }
    });
  }

  softDeleteRole(role: Role): void {
    const ref = this.dialog.open(ConfirmDialog, {
      width: '420px',
      maxWidth: '95vw',
      disableClose: true,
      data: {
        type: 'danger',
        title: 'Confirmación',
        message: `¿Seguro que deseas eliminar el rol "${role.name}"?`,
        cancelText: 'Cancelar',
        confirmText: 'Eliminar'
      }
    });

    ref.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) {
        return;
      }

      this.loading = true;
      this.rolService.softDeleteRole(role.id).subscribe({
        next: () => {
          this.loading = false;
          this.toastService.info('Operacón exitosa', `Se elimino correctamente el rol "${role.name}.`, 6000);
          this.loadRoles();
        },
        error: () => {
          this.loading = false;
          this.toastService.info('Error', "No se pudo eliminar rol correctamente. Intenta nuevamente.", 6000);
        }
      });
    });
  }
}

import { Component, ViewChild } from '@angular/core';
import { Role } from '../../../models/emplado.model';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { RolService } from '../../../core/services/rol.service';
import { MatIconModule } from '@angular/material/icon';
import { AltaRolDialog } from '../../../shared/dialogs/alta-rol-dialog/alta-rol-dialog';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PensionAlimenDialog } from '../../pension-alimenticia/pension-alimen-dialog/pension-alimen-dialog';
import { ConfirmDialog } from '../../../shared/dialogs/confirm-dialog/confirm-dialog';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';

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
    MatSortModule  
  ],
  templateUrl: './gestion-role.html',
  styleUrl: './gestion-role.css'
})
export class GestionRole {

  @ViewChild(MatSort) sort?: MatSort;
  @ViewChild(MatPaginator) paginator?: MatPaginator
  dataSource  = new MatTableDataSource<Role>([]);
  roles: Role[] = [];
  displayedColumns: string[] = ['id', 'rol', 'padre', 'acciones'];
  totalRoles = 0;
  pageSize = 10;
  pageIndex = 0;
  activeSort: Sort = { active: 'id', direction: 'asc' };
  loading = false;

  constructor(private rolService: RolService,  private dialog: MatDialog) {}

  ngOnInit(): void {
     this.loadRoles();
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
      error: (err) => {
        this.loading = false;
        console.error('Error cargando roles', err);
      },
    });
  }

  onSortChange(sort: Sort): void {
    this.activeSort = sort.direction ? sort : { active: 'id', direction: 'asc' };
    this.pageIndex = 0;
    this.applyTableState();
  }

  onPageChange(event: { pageIndex: number; pageSize: number }): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.applyTableState();
  }

  private applyTableState(): void {
    const sortedRoles = [...this.roles].sort((a, b) => this.compareRoles(a, b));
    const start = this.pageIndex * this.pageSize;
    const end = start + this.pageSize;
    this.dataSource.data = sortedRoles.slice(start, end);
  }

  private compareRoles(a: Role, b: Role): number {
    const direction = this.activeSort.direction === 'asc' ? 1 : -1;
    const valueA = this.getSortValue(a, this.activeSort.active);
    const valueB = this.getSortValue(b, this.activeSort.active);

    if (valueA < valueB) return -1 * direction;
    if (valueA > valueB) return 1 * direction;
    return 0;
  }

  private getSortValue(role: Role, column: string): string | number {
    switch (column) {
      case 'id':
        return role.id ?? 0;
      case 'name':
        return role.name ?? '';
      case 'modulesName':
        return role.modulesName ?? role.modulesname ?? '';
      default:
        return '';
    }
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
    width: '600px',
    maxWidth: '95vw',
    autoFocus: false,
  });

    ref.afterClosed().subscribe((payload) => {
      if (!payload) return;
      this.loading = true;
      this.rolService.createRole(payload).subscribe({
        next: () => {
          this.loading = false;
          this.dialog.open(PensionAlimenDialog, {
            width: '400px',
            disableClose: true,
            data: {
              type: 'success',
              title: 'Alta correcta',
              message: 'El rol se agregó correctamente.'
            }
          });

          this.loadRoles();
        },
        error: (err) => {
          this.loading = false;
          console.error('Error creando rol', err);
          this.dialog.open(PensionAlimenDialog, {
            width: '400px',
            data: {
              type: 'error',
              title: 'Error',
              message: 'No se pudo agregar el rol.'
            }
          });
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
              this.dialog.open(PensionAlimenDialog, {
                width: '400px',
                disableClose: true,
                data: {
                  type: 'success',
                  title: 'Actualización correcta',
                  message: 'El rol se actualizó correctamente.'
                }
              });
              this.loadRoles();
            },
            error: (err) => {
              this.loading = false;
              console.error('Error actualizando rol', err);
            }
          });
        });
      },
      error: (err) => {
        this.loading = false;
        console.error('Error cargando detalle del rol', err);
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
      title: 'Eliminar rol',
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
        this.dialog.open(PensionAlimenDialog, {
          width: '420px',
          data: {
            type: 'success',
            title: 'Eliminación correcta',
            message: 'El rol se eliminó correctamente.'
          }
        });
        this.loadRoles();
      },
      error: (err) => {
        this.loading = false;
        console.error('Error eliminando rol', err);
        this.dialog.open(PensionAlimenDialog, {
          width: '420px',
          data: {
            type: 'error',
            title: 'Error',
            message: 'No se pudo eliminar el rol.'
          }
        });
      }
    });
  });
}
}

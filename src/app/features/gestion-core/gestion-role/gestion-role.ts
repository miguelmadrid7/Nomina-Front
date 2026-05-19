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
import { PensionAlimenDialog } from '../../nomina/pension-alimen-dialog/pension-alimen-dialog';
import { ConfirmDialog } from '../../../shared/dialogs/confirm-dialog/confirm-dialog';
import { MatSort, MatSortModule } from '@angular/material/sort';

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
  displayedColumns: string[] = ['id', 'rol', 'acciones'];
  loading = false;

  constructor(private rolService: RolService,  private dialog: MatDialog) {}

  ngOnInit(): void {
     this.loadRoles();
  }

  loadRoles(): void {
    this.loading = true;
    this.rolService.getRoles().subscribe({
      next: (roles: Role[]) => {
        this.dataSource.data = roles;
          setTimeout(() => {
            this.dataSource.sort = this.sort!;
            this.dataSource.paginator = this.paginator!;
            this.sort!.sort({ id: 'id', start: 'desc', disableClear: false });
        });
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        console.error('Error cargando roles', err);
      },
    });
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
  const ref = this.dialog.open(AltaRolDialog, {
    width: '600px',
    maxWidth: '95vw',
    autoFocus: false,
    data: role
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

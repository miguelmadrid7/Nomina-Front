import { Component, ViewChild } from '@angular/core';
import { EmpleadoItem, Role } from '../../../models/emplado.model';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { RolService } from '../../../core/services/rol.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-gestion-role-usuarios',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatPaginatorModule,
    MatTableModule,
    MatIconModule,
  ],
  templateUrl: './gestion-role-usuarios.html',
  styleUrl: './gestion-role-usuarios.css'
})
export class GestionRoleUsuarios {

  @ViewChild(MatPaginator) paginator?: MatPaginator
  dataSource  = new MatTableDataSource<Role>([]);
  displayedColumns: string[] = ['id', 'rol', 'acciones'];
  loading = false;

  constructor(private rolService: RolService) {}

  ngOnInit(): void {
    this.loadRoles();
  }

  ngAfterViewInit(): void {
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
  }

  loadRoles(): void {
    this.loading = true;

    this.rolService.getRoles().subscribe({
      next: (roles: Role[]) => {
        this.dataSource.data = roles;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        console.error('Error cargando roles', err);
      },
    });
  }

}

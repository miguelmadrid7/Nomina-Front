import { ChangeDetectorRef, Component, NgZone } from '@angular/core';
import { ModuleService } from '../../../core/services/module.service';
import { ModuleItem } from '../../../models/gestion-core/module.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ModuleDialog } from '../../../shared/dialogs/module-dialog/module-dialog';

@Component({
  selector: 'app-gestion-modulos',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatIconModule,
    MatDialogModule,
  ],
  templateUrl: './gestion-modulos.html',
  styleUrl: './gestion-modulos.css'
})
export class GestionModulos {

  displayedColumns: string[] = ['name','description','vista','parent','icon','actions'];
  modules: ModuleItem[] = [];
  loading = false;
  totalElements = 0;
  selectedModule: ModuleItem | null = null;
  detailLoading = false;
  loadingModuleId: number | null = null;

  constructor(private moduleService: ModuleService, private zone: NgZone, private snackBar: MatSnackBar, private cdr: ChangeDetectorRef, private dialog: MatDialog,) {}

  private showSnack(message: string, action: string, duration: number): void {
    this.zone.runOutsideAngular(() => {
      setTimeout(() => {
        this.zone.run(() => this.snackBar.open(message, action, { duration }));
      }, 50);
    });
  }

  ngOnInit(): void {
    this.getAllModules();
  }

  getAllModules(): void {
    this.loading = true;
    this.moduleService.getAllModules().subscribe({
      next: (modules) => {
        this.modules = [...modules];
        this.totalElements = modules.length;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.modules = [];
        this.totalElements = 0;
        this.loading = false;
        this.showSnack('No se pudieron cargar los módulos.', 'Cerrar', 4000);
        this.cdr.markForCheck();
      }
    });
  }

  getModuleById(moduleId: number): void {
    this.loadingModuleId = moduleId;
    this.cdr.markForCheck();
    this.moduleService.getModule(moduleId).subscribe({
      next: (module) => {
        this.selectedModule = module;
        this.loadingModuleId = null;

        const dialogRef = this.dialog.open(ModuleDialog, {
          width: '700px',
          maxWidth: '95vw',
          data: {
            mode: 'edit',
            module
          }
        });

        dialogRef.afterClosed().subscribe((refresh: boolean) => {
          if (refresh) {
            this.getAllModules();
          }
        });

        this.cdr.markForCheck();
      },
      error: () => {
        this.selectedModule = null;
        this.loadingModuleId = null;
        this.showSnack('No se pudo obtener el detalle del módulo.', 'Cerrar', 4000);
        this.cdr.markForCheck();
      }
    });
  }

  softDeleteModule(moduleId: number): void {
    const confirmed = confirm('¿Seguro que deseas eliminar este módulo?');
    if (!confirmed) {
      return;
    }

    this.moduleService.softDeleteModule(moduleId).subscribe({
      next: () => {
        this.showSnack('Módulo eliminado correctamente.', 'Cerrar', 4000);
        this.getAllModules();
      },
      error: () => {
        this.showSnack('No se pudo eliminar el módulo.', 'Cerrar', 4000);
      }
    });
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(ModuleDialog, {
      width: '700px',
      maxWidth: '95vw',
      data: {
        mode: 'create'
      }
    });
    dialogRef.afterClosed().subscribe((refresh: boolean) => {
      if (refresh) {
        this.getAllModules();
      }
    });
  }
}

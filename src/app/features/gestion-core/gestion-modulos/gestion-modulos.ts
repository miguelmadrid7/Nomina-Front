import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ModuleService } from '../../../core/services/module.service';
import { Module } from '../../../core/model/gestion-core/module.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule, NgIf } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ALtaModuleDialog } from '../../../shared/dialogs/alta-module-dialog/alta-module-dialog';
import { ConfirmDialog } from '../../../shared/dialogs/confirm-dialog/confirm-dialog';

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
export class GestionModulos implements OnInit, OnDestroy {

  private readonly moduleService = inject(ModuleService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly dialog = inject(MatDialog);

  @ViewChild(MatPaginator) paginator?: MatPaginator;
  displayedColumns: string[] = ['name','description','vista','parent','icon','actions'];
  modules = new MatTableDataSource<Module>([]);
  loading = false;
  loadingModuleId: number | null = null;
  totalModules = 0;
  pageSize = 10;
  pageIndex = 0;

  selectedModule: Module | null = null;
  detailLoading = false;

  private allModules: Module[] = [];

  private showSnack(message: string, action = 'Cerrar', duration = 4000) {
    this.snackBar.open(message, action, {duration});
  }

  ngOnInit(): void {
    this.getAllModules();
  }

  ngOnDestroy(): void {
    this.dialog.closeAll();
  }

  onPageChange(event: { pageIndex: number; pageSize: number }): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.applyTableState();
  }

  private applyTableState(): void {
    const grouped = this.groupModulesByParent([...this.allModules]);
    const start = this.pageIndex * this.pageSize;
    const end = start + this.pageSize;
    this.modules.data = grouped.slice(start, end);
  }

  private groupModulesByParent(modules: Module[]): Module[] {
    const result: Module[] = [];
    const childrenByParentId = new Map<number, Module[]>();
    const childrenByParentName = new Map<string, Module[]>();
    const moduleIds = new Set(modules.map(module => module.id).filter((id): id is number => id !== undefined));
    const moduleNames = new Set(modules.map(module => this.normalizeText(module.name)));

    modules.forEach(module => {
      if (module.parentId && moduleIds.has(module.parentId)) {
        const children = childrenByParentId.get(module.parentId) ?? [];
        children.push(module);
        childrenByParentId.set(module.parentId, children);
        return;
      }

      if (module.parent && moduleNames.has(this.normalizeText(module.parent))) {
        const parentName = this.normalizeText(module.parent);
        const children = childrenByParentName.get(parentName) ?? [];
        children.push(module);
        childrenByParentName.set(parentName, children);
      }
    });

    const parentModules = modules.filter(module => {
      const hasParentById = !!module.parentId && moduleIds.has(module.parentId);
      const hasParentByName = !!module.parent && moduleNames.has(this.normalizeText(module.parent));
      return !hasParentById && !hasParentByName;
    });

    parentModules.forEach(parent => {
      result.push(parent);
      result.push(...(childrenByParentId.get(parent.id ?? 0) ?? []));
      result.push(...(childrenByParentName.get(this.normalizeText(parent.name)) ?? []));
    });

    return result;
  }

  private normalizeText(value: string | null | undefined): string {
    return (value ?? '').trim().toLowerCase();
  }

  isParentModule(module: Module): boolean {
    if (!module) {
      return false;
    }

    return this.allModules.some(item => {
      const hasParentById = !!module.id && item.parentId === module.id;
      const hasParentByName = !!item.parent && this.normalizeText(item.parent) === this.normalizeText(module.name);
      return hasParentById || hasParentByName;
    });
  }

  getAllModules(): void {
    this.loading = true;
    this.moduleService.getAllModules().subscribe({
      next: (modules) => {
        this.allModules = [...modules];
        this.totalModules = this.allModules.length;
        this.pageIndex = 0;
        this.applyTableState();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.allModules = [];
        this.modules.data = [];
        this.totalModules = 0;
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
        const parentModule = module.parent ? this.modules.data.find(item => item.name === module.parent) : null;
        const moduleWithParent = {
          ...module,
          parentId: module.parentId ?? parentModule?.id ?? null
        };
        this.selectedModule = moduleWithParent;
        this.loadingModuleId = null;

        const dialogRef = this.dialog.open(ALtaModuleDialog, {
          width: '850px',
          maxWidth: '95vw',
          data: {
            mode: 'edit',
            module: moduleWithParent
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
    const dialogRef = this.dialog.open(ConfirmDialog, {
      width: '450px',
      disableClose: true,
      data: {
        title: 'Eliminar módulo',
        message: '¿Seguro que deseas eliminar este módulo?',
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;

      this.moduleService.softDeleteModule(moduleId).subscribe({
        next: () => {
          this.getAllModules();
          this.dialog.open(ConfirmDialog, {
            width: '360px',
            data: {
              title: 'Operación exitosa',
              message: 'Módulo eliminado correctamente.',
              confirmText: 'Aceptar'
            }
          });
        },
        error: () => {
          this.dialog.open(ConfirmDialog, {
            width: '360px',
            data: {
              title: 'Error',
              message: 'No se pudo eliminar el módulo.',
              confirmText: 'Aceptar',
              type: 'error'
            }
          });
        }
      });
    });
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(ALtaModuleDialog, {
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

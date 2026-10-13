import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ModuleService } from '../../../core/services/module.service';
import { Module } from '../../../core/model/gestion-core/module.model';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ALtaModuleDialog } from '../../../shared/dialogs/alta-module-dialog/alta-module-dialog';
import { ConfirmDialog } from '../../../shared/dialogs/confirm-dialog/confirm-dialog';
import { ToastService } from '../../../core/services/toast.service';
import { CalendarioService } from '../../../core/services/calendario.service';
import { Calendario } from '../../../core/model/calendario.model';
import { ModuleRow } from '../../../core/model/gestion-core/module-row.model';

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
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly dialog = inject(MatDialog);
  private readonly toastService = inject(ToastService);
  private readonly cd = inject(ChangeDetectorRef);
  private readonly calendarioService = inject(CalendarioService);

  @ViewChild(MatPaginator) paginator?: MatPaginator;
  displayedColumns: string[] = ['name','description','vista','parent','icon','actions'];
  
  modules = new MatTableDataSource<ModuleRow>([]);
  loading = false;
  loadingModuleId: number | null = null;
  totalModules = 0;
  pageSize = 10;
  pageIndex = 0;
  selectedModule: Module | null = null;
  detailLoading = false;
  cargandoQna = false;
  calendarioActual: Calendario | null = null;
  errorQna = false;

  private groupedModules: ModuleRow[] = [];
  private allModules: Module[] = [];


  ngOnInit(): void {
    this.getAllModules();
    this.loadQnaActivated();
  }

  ngOnDestroy(): void {
    this.dialog.closeAll();
  }

  private applyTableState(): void {
    const start = this.pageIndex * this.pageSize;
    this.modules.data = this.groupedModules.slice(start, start + this.pageSize);
  }

  private buildTree(modules: Module[]): ModuleRow[] {
    const ids = new Set(modules.map(m => m.id).filter((id): id is number => id != null));
    const idsByName = new Map<string, number[]>();
    for (const m of modules) {
      if (m.id == null) continue;
      const key = this.normalizeText(m.name);
      idsByName.set(key, [...(idsByName.get(key) ?? []), m.id]);
    }

    const resolveParentId = (m: Module): number | null => {
      if (m.parentId != null && ids.has(m.parentId)) return m.parentId;
      if (m.parent) {
        const matches = idsByName.get(this.normalizeText(m.parent)) ?? [];
        if (matches.length === 1) return matches[0]; // ambiguous names are not guessed
      }
      return null;
    };

    const childrenOf = new Map<number | null, Module[]>();
    for (const m of modules) {
      const parentId = resolveParentId(m);
      childrenOf.set(parentId, [...(childrenOf.get(parentId) ?? []), m]);
    }
    const result: ModuleRow[] = [];
    const visited = new Set<number>();
    const walk = (parentId: number | null, level: number): void => {
      const children = [...(childrenOf.get(parentId) ?? [])].sort((a, b) => a.name.localeCompare(b.name));
      for (const child of children) {
        if (child.id == null || visited.has(child.id)) continue;
        visited.add(child.id);
        result.push({ ...child, level, isParent: (childrenOf.get(child.id)?.length ?? 0) > 0 });
        walk(child.id, level + 1);
      }
    };
    walk(null, 0);
    for (const m of modules) {
      if (m.id != null && !visited.has(m.id)) {
        result.push({ ...m, level: 0, isParent: false });
      }
    }

    return result;
  }

  private normalizeText(value: string | null | undefined): string {
    return (value ?? '').trim().toLowerCase();
  }

  onPageChange(event: { pageIndex: number; pageSize: number }): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.applyTableState();
  }

  loadQnaActivated(): void {
    this.cargandoQna = true;
    this.errorQna = false;
    this.calendarioService.getQnaActiva().subscribe({
      next: (resp) => {
        const calendario = resp?.data ?? null;
        this.calendarioActual = calendario;
        this.cargandoQna = false;
        this.errorQna = !calendario;
        this.cd.detectChanges();
      },
      error: () => {
        this.calendarioActual = null;
        this.cargandoQna = false;
        this.errorQna = true;
        this.cd.detectChanges();
      }
    });
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
        this.groupedModules = this.buildTree(this.allModules);
        this.totalModules = this.groupedModules.length;
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
        this.toastService.error('Error', 'No se pudieron cargar los módulos.', 4000);
        this.cdr.markForCheck();
      }
    });
  }

  getModuleById(moduleId: number): void {
    this.loadingModuleId = moduleId;
    this.cdr.markForCheck();
    this.moduleService.getModule(moduleId).subscribe({
      next: (module) => {
        const parentModule = module.parent ? this.allModules.find(item => item.name === module.parent): null;
        const moduleWithParent: Module = {
          ...module,
          parentId: module.parentId ?? parentModule?.id ?? null,
        };
        this.selectedModule = moduleWithParent;
        this.loadingModuleId = null;
        const dialogRef = this.dialog.open(ALtaModuleDialog, {
          width: '850px',
          maxWidth: '95vw',
          data: {
            mode: 'edit',
            module: moduleWithParent,
            modules: this.allModules
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
        this.toastService.error('Error', 'No se pudo obtener el detalle del módulo.', 4000);
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
          this.toastService.info('Operación exitosa', 'Módulo eliminado correctamente', 6000);
        },
        error: () => {
          this.toastService.error('Accion invalida', 'Error al eliminar el módulo. Intente nuevamente', 6000);
        }
      });
    });
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(ALtaModuleDialog, {
      width: '700px',
      maxWidth: '95vw',
      data: {
        mode: 'create',
        modules: this.allModules
      }
    });
    dialogRef.afterClosed().subscribe((refresh: boolean) => {
      if (refresh) {
        this.getAllModules();
      }
    });
  }
}

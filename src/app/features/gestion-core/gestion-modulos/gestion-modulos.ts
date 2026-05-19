import { ChangeDetectorRef, Component, NgZone, ViewChild } from '@angular/core';
import { ModuleService } from '../../../core/services/module.service';
import { ModuleItem } from '../../../models/gestion-core/module.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ModuleDialog } from '../../../shared/dialogs/module-dialog/module-dialog';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';

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
    MatSortModule,
  ],
  templateUrl: './gestion-modulos.html',
  styleUrl: './gestion-modulos.css'
})
export class GestionModulos {

  @ViewChild(MatSort) sort?: MatSort;
  @ViewChild(MatPaginator) paginator?: MatPaginator;
  displayedColumns: string[] = ['name','description','vista','parent','icon','actions'];
  modules = new MatTableDataSource<ModuleItem>([]);
  loading = false;
  totalElements = 0;
  selectedModule: ModuleItem | null = null;
  detailLoading = false;
  loadingModuleId: number | null = null;
  private allModules: ModuleItem[] = [];

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

  ngAfterViewInit(): void {
    this.modules.sortingDataAccessor = (data: ModuleItem, sortHeaderId: string): string | number => {
      switch (sortHeaderId) {
        case 'vista':
          return data.vista ? 1 : 0;
        default:
          return ((data as any)[sortHeaderId] ?? '').toString().toLowerCase();
      }
    };

    this.attachTableControllers();
  }

  private attachTableControllers(): void {
    if (this.paginator) {
      this.modules.paginator = this.paginator;
    }
  }

  sortModules(sort: Sort): void {
    const data = [...this.allModules];

    if (!sort.active || sort.direction === '') {
      this.modules.data = this.groupModulesByParent(data);
      return;
    }

    const sortedData = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      return this.compare(this.getSortValue(a, sort.active), this.getSortValue(b, sort.active), isAsc);
    });

    this.modules.data = this.groupModulesByParent(sortedData);
  }

  private getSortValue(module: ModuleItem, column: string): string | number {
    switch (column) {
      case 'vista':
        return module.vista ? 1 : 0;
      default:
        return ((module as any)[column] ?? '').toString().toLowerCase();
    }
  }

  private compare(a: string | number, b: string | number, isAsc: boolean): number {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  private groupModulesByParent(modules: ModuleItem[]): ModuleItem[] {
    const result: ModuleItem[] = [];
    const childrenByParentId = new Map<number, ModuleItem[]>();
    const childrenByParentName = new Map<string, ModuleItem[]>();
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

  isParentModule(module: ModuleItem): boolean {
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
        this.modules.data = this.groupModulesByParent(this.allModules);
        this.totalElements = modules.length;
        this.loading = false;
        this.attachTableControllers();
        this.cdr.markForCheck();
      },
      error: () => {
        this.modules.data = [];
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
        const parentModule = module.parent ? this.modules.data.find(item => item.name === module.parent) : null;
        const moduleWithParent = {
          ...module,
          parentId: module.parentId ?? parentModule?.id ?? null
        };
        this.selectedModule = moduleWithParent;
        this.loadingModuleId = null;

        const dialogRef = this.dialog.open(ModuleDialog, {
          width: '700px',
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

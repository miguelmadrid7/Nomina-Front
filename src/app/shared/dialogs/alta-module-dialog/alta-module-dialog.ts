import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Module } from '../../../core/model/gestion-core/module.model';
import { DialogData } from '../../../core/model/gestion-core/module-dialog-data.model';
import { ModuleRequest } from '../../../core/model/request/module-request.model';
import { ModuleRole } from '../../../core/model/gestion-core/module-role.model';
import { ModuleRolePermissionRequest } from '../../../core/model/request/module-role-permission-request.model';
import { MatIconModule } from '@angular/material/icon';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModuleService } from '../../../core/services/module.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { Role } from '../../../core/model/rol.model';
import { UserService } from '../../../core/services/user.service';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { UppercaseDirective } from '../../directives/upperCase.directivas';
import { ToastService } from '../../../core/services/toast.service';
import { Icon } from '../../../core/model/gestion-core/icon.model';
import { IconService } from '../../../core/services/icon.service';

type PermissionKey = 'canUpdate' | 'canAdd' | 'canDelete' | 'canAuthorize' | 'canViewTechnicalDetail';

@Component({
  selector: 'app-module-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatSelectModule,
    UppercaseDirective
  ],
  templateUrl: './alta-module-dialog.html',
  styleUrl: './alta-module-dialog.css'
})
export class ALtaModuleDialog implements OnInit {

  form!: FormGroup;
  roles$!: Observable<Role[]>;
  opcionesPadre: Module[] = [];
  icons = signal<Icon[]>([]);
  private readonly roleNames = signal<Map<number, string>>(new Map());
  private initialPermissions = new Map<number, ModuleRole>();

  readonly permissionColumns: { key: PermissionKey; label: string }[] = [
    { key: 'canUpdate', label: 'Editar' },
    { key: 'canAdd', label: 'Agregar' },
    { key: 'canDelete', label: 'Eliminar' },
    { key: 'canAuthorize', label: 'Autorizar' },
    { key: 'canViewTechnicalDetail', label: 'Ver detalle técnico' },
  ];

  private readonly dialogRef = inject(MatDialogRef<ALtaModuleDialog>);
  readonly data = inject<DialogData>(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly moduleService = inject(ModuleService);
  private readonly userService = inject(UserService);
  private readonly toastService = inject(ToastService);
  private readonly iconService = inject(IconService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    const module = this.module;
    this.initialPermissions = new Map((module.roles ?? []).map(role => [role.roleId, role]));

    this.form = this.fb.group({
      id: [{ value: module.id ?? '', disabled: true }],
      name: [module.name ?? '', Validators.required],
      path: [module.path ?? ''],
      description: [module.description ?? '', Validators.required],
      visible: [module.visible ?? module.vista ?? true, Validators.required],
      iconId: [module.iconId ?? 1, Validators.required],
      parentId: [module.parentId ?? null],
      rolesId: [module.rolesId ?? module.roles?.map(role => role.roleId) ?? [], Validators.required],
      permissions: this.fb.array<FormGroup>([]),
    });

    const rolesControl = this.form.get('rolesId')!;
    this.syncPermissions(rolesControl.value ?? []);
    rolesControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((ids: number[]) => this.syncPermissions(ids ?? []));

    this.loadRoles();
    this.loadIcons();
    this.opcionesPadre = this.calcularOpcionesPadre();
  }

  get permissions(): FormArray<FormGroup> {
    return this.form.get('permissions') as FormArray<FormGroup>;
  }

  roleName(roleId: number): string {
    return this.roleNames().get(roleId) ?? this.initialPermissions.get(roleId)?.name ?? '';
  }

  private syncPermissions(roleIds: number[]): void {
    for (let i = this.permissions.length - 1; i >= 0; i--) {
      const roleId = this.permissions.at(i).get('roleId')?.value as number;
      if (!roleIds.includes(roleId)) this.permissions.removeAt(i);
    }

    const currentIds = new Set(this.permissions.controls.map(group => group.get('roleId')?.value as number));
    roleIds
      .filter(roleId => !currentIds.has(roleId))
      .forEach(roleId => this.permissions.push(this.createPermissionGroup(roleId)));
  }

  private createPermissionGroup(roleId: number): FormGroup {
    const current = this.initialPermissions.get(roleId);
    return this.fb.group({
      roleId: [roleId],
      canUpdate: [current?.canUpdate ?? false],
      canAdd: [current?.canAdd ?? false],
      canDelete: [current?.canDelete ?? false],
      canAuthorize: [current?.canAuthorize ?? false],
      canViewTechnicalDetail: [current?.canViewTechnicalDetail ?? false],
    });
  }

  private calcularOpcionesPadre(): Module[] {
    const todos = this.data.modules ?? [];
    const excluidos = new Set<number>();
    const marcar = (id: number) => {
      excluidos.add(id);
      todos
        .filter(m => m.parentId === id && m.id != null && !excluidos.has(m.id))
        .forEach(m => marcar(m.id!));
    };
    if (this.module.id != null) marcar(this.module.id);
    return todos
      .filter(m => m.id != null && !excluidos.has(m.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  get mode(): 'create' | 'edit' {
    return this.data.mode;
  }

  get module(): Module {
    return this.data.module ?? {
      id: undefined,
      name: '',
      description: null,
      vista: true,
      visible: true,
      parent: null,
      icon: null,
      path: null,
      iconId: null,
      parentId: null,
      rolesId: [],
    };
  }

  loadRoles(): void {
    this.roles$ = this.userService.getRoles().pipe(
      map(roles => [...roles]),
      tap(roles => this.roleNames.set(new Map(roles.map(role => [role.id, role.name])))),
      catchError(() => of([]))
    );
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    if (!raw.rolesId?.length) {
      this.form.get('rolesId')?.setErrors({ required: true });
      this.form.markAllAsTouched();
      return;
    }
    const parentId = raw.parentId === null || raw.parentId === undefined || raw.parentId === '' ? null : Number(raw.parentId);
    const path = raw.path === null || raw.path === undefined || raw.path === '' ? null : raw.path;
    const roles: ModuleRolePermissionRequest[] = this.permissions.getRawValue().map(permission => ({
      roleId: Number(permission['roleId']),
      canUpdate: !!permission['canUpdate'],
      canAdd: !!permission['canAdd'],
      canDelete: !!permission['canDelete'],
      canAuthorize: !!permission['canAuthorize'],
      canViewTechnicalDetail: !!permission['canViewTechnicalDetail'],
    }));
    const payload: ModuleRequest = {
      name: raw.name,
      path,
      description: raw.description || '',
      visible: raw.visible,
      iconId: Number(raw.iconId || 1),
      parentId,
      roles,
    };
    const request$ = this.mode === 'edit' && this.data.module?.id ? this.moduleService.updateModule(this.data.module.id, payload) : this.moduleService.createModule(payload);
    request$.subscribe({
      next: () => {
        this.dialogRef.close(true);
        this.toastService.info('Operación exitosa.', this.mode == 'edit' ? 'Módulo actualizado correctamente' : 'Módulo creado con exito', 6000);
      },
      error: () => {
        this.toastService.warning('Accion invalida.', this.mode == 'edit' ? 'No se pudo actualizar el módulo' : 'No se pudo crear el módulo', 6000);
      }
    });
  }

  close(): void {
    this.dialogRef.close();
  }

  private loadIcons(): void {
    this.iconService.getIcons().subscribe({
      next: (icons) => this.icons.set(icons),
      error: () => this.toastService.error('Error', 'No se pudieron cargar los íconos.'),
    });
  }

  get selectedIcon(): Icon | undefined {
    const id = Number(this.form?.get('iconId')?.value);
    return this.icons().find((i) => i.id === id);
  }
}
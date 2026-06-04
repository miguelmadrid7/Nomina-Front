import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ModuleDialogData, ModuleItem } from '../../../models/gestion-core/module.model';
import { ModuleRequest } from '../../../models/request/module-request.model';
import { MatIconModule } from '@angular/material/icon';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModuleService } from '../../../core/services/module.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { Role } from '../../../models/emplado.model';
import { UserService } from '../../../core/services/user.service';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

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
    MatSelectModule
  ],
  templateUrl: './module-dialog.html',
  styleUrl: './module-dialog.css'
})
export class ModuleDialog implements OnInit{

  form!: FormGroup;
  roles$!: Observable<Role[]>;

  constructor(private dialogRef: MatDialogRef<ModuleDialog>, @Inject(MAT_DIALOG_DATA) public data: ModuleDialogData, private fb: FormBuilder,private moduleService: ModuleService, private userService: UserService,) {}

  ngOnInit(): void {
    const module = this.module;
      this.form = this.fb.group({
        id: [{ value: module.id ?? '', disabled: true }],
        name: [module.name ?? '', Validators.required],
        path: [module.path ?? '', this.mode === 'create' ? Validators.required : []],
        description: [module.description ?? '', Validators.required],
        visible: [module.visible ?? module.vista ?? true, Validators.required],
        iconId: [module.iconId ?? 1, Validators.required],
        parentId: [module.parentId ?? null],
        rolesId: [module.rolesId ?? module.roles?.map(role => role.id) ?? [], Validators.required],
      });
      this.loadRoles();
  }

  get mode(): 'create' | 'edit' {
    return this.data.mode;
  }

  get module(): ModuleItem {
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
    const payload: ModuleRequest = {
      name: raw.name,
      path,
      description: raw.description || '',
      visible: raw.visible,
      iconId: Number(raw.iconId || 1),
      parentId,
      rolesId: raw.rolesId,
    };
    const request$ = this.mode === 'edit' && this.data.module?.id ? this.moduleService.updateModule(this.data.module.id, payload) : this.moduleService.createModule(payload);
    request$.subscribe({
      next: () => {
        this.dialogRef.close(true);
      },
      error: () => {}
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}

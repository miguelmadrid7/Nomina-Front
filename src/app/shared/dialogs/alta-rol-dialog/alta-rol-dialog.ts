import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { UppercaseDirective } from '../../directives/upperCase.directivas';
import { Role } from '../../../models/rol.model';
import { MatSelectModule } from '@angular/material/select';
import { ModuleService } from '../../../core/services/module.service';
import { Module } from '../../../models/gestion-core/module.model';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-alta-rol-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule,
    UppercaseDirective
  ],
  templateUrl: './alta-rol-dialog.html',
  styleUrl: './alta-rol-dialog.css'
})
export class AltaRolDialog {

  form!: FormGroup;
  modules$!: Observable<Module[]>;

  constructor(private  fb: FormBuilder, private  ref: MatDialogRef<AltaRolDialog>, @Inject(MAT_DIALOG_DATA) public data: Role | null, private moduleService: ModuleService) {}

  ngOnInit() {
    this.form = this.fb.group({
      name: [this.data?.name ?? '', [Validators.required]],
      description: [this.data?.description ?? '', [Validators.required]],
      parentId: [this.data?.parentId ?? null],
      permissionId: [this.data?.permissionId ?? null],
      modulesId: [(this.data as any)?.modulesId ?? (this.data as any)?.modules?.map((module: Module) => module.id) ?? [], [Validators.required]],
    });
    this.modules$ = this.moduleService.getAllModules().pipe(catchError(() => of([])));
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();

    this.ref.close({
      ...raw,
      parentId: raw.parentId ?? null,
      permissionId: raw.permissionId ?? null,
      modulesId: raw.modulesId ?? [],
    });
  }

  cerrar(): void {
    this.ref.close(null);
  }

}

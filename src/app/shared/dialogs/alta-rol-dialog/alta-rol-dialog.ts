import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { UppercaseDirective } from '../../directives/upperCase.directivas';
import { Role } from '../../../models/emplado.model';

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
    UppercaseDirective
  ],
  templateUrl: './alta-rol-dialog.html',
  styleUrl: './alta-rol-dialog.css'
})
export class AltaRolDialog {

  form!: FormGroup;

  constructor(private  fb: FormBuilder, private  ref: MatDialogRef<AltaRolDialog>, @Inject(MAT_DIALOG_DATA) public data: Role | null) {}

  ngOnInit() {
    this.form = this.fb.group({
      name: [this.data?.name ?? '', [Validators.required]],
      description: [this.data?.description ?? ''],
      parentId: [this.data?.parentId ?? null],
      permissionId: [this.data?.permissionId ?? null],
    });
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
      modulesId: [],
    });
  }

  cerrar(): void {
    this.ref.close(null);
  }

}

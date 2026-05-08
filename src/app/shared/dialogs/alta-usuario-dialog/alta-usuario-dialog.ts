import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { UppercaseDirective } from '../../directives/upperCase.directivas';

@Component({
  selector: 'app-alta-usuario-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    UppercaseDirective
  ],
  templateUrl: './alta-usuario-dialog.html',
  styleUrl: './alta-usuario-dialog.css'
})
export class AltaUsuarioDialog {
  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private ref: MatDialogRef<AltaUsuarioDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}

  ngOnInit(): void {
    const roles = this.data?.roles ?? [];
    const defaultRoleId = roles.length === 1 ? roles[0]?.id : null;

    this.form = this.fb.group({
      user: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      srl_emp: [null, [Validators.required]],
      area: [''],
      task: [''],
      active: [true],
      principal: ['pages/Inicio/General'],
      extras: [[]],
      roles: [defaultRoleId ? [defaultRoleId] : [], [Validators.required]],
    });
  }

  guardar(): void {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }

    this.ref.close(this.form.getRawValue());
  }

  cerrar(): void {
    this.ref.close();
  }
}

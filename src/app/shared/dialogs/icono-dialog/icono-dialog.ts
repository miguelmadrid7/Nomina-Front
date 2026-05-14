import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { IconService } from '../../../core/services/icon.service';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { UppercaseDirective } from '../../directives/upperCase.directivas';

@Component({
  selector: 'app-icono-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    UppercaseDirective
  ],
  templateUrl: './icono-dialog.html',
  styleUrl: './icono-dialog.css'
})
export class IconoDialog implements OnInit {

  form!: FormGroup;
  loading = false;
  message = '';
  error = '';

  constructor(private fb: FormBuilder, private iconService: IconService, private dialogRef: MatDialogRef<IconoDialog>) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['', Validators.required],
      icon: ['', Validators.required],
      description: ['', Validators.required],
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.message = '';
    this.error = '';
    const payload = {
      name: this.form.value.name!,
      icon: this.form.value.icon!,
      description: this.form.value.description!,
    };
    this.iconService.createIcon(payload).subscribe({
      next: () => {
        this.loading = false;
        this.dialogRef.close(true);
      },
      error: () => {
        this.error = 'No se pudo agregar el icono';
        this.loading = false;
      }
    });
  }

  close(): void {
    this.dialogRef.close(false);
  }
}
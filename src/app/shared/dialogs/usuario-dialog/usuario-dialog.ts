import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { AssignRoleRequest, EmpleadoItem } from '../../../models/emplado.model';
import { UserService } from '../../../core/services/user.service';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-usuario-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatSelectModule,
    MatCardModule,


  ],
  templateUrl: './usuario-dialog.html',
  styleUrls: ['./usuario-dialog.css']
})
export class UsuarioDialog {

  form!: FormGroup;
  selectedRoleIdsSet = new Set<number>();
  loading = false;
  empleadoActual: EmpleadoItem | null = null;
  selectedRoles: number[] = [];

  constructor(
    private fb: FormBuilder,
    private ref: MatDialogRef<UsuarioDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private userService: UserService,
  ) {}

  ngOnInit(): void {
    const user = this.data?.user ?? this.data;
    const pre = this.data?.selectedRoleIds ?? [];
    this.selectedRoleIdsSet = new Set<number>(pre);

    this.form = this.fb.group({
      id: [{ value: user?.id ?? '', disabled: true }],
      catEmpleadoId: [user?.catEmpleadoId ?? ''],
      username: [user?.username ?? ''],
      email: [user?.email ?? ''],
      area: [user?.area ?? ''],
      task: [user?.task ?? ''],
      active: [!!user?.active],
      deleted: [!!user?.deleted],
      isVerified: [!!user?.isVerified],
      isPassword: [!!user?.isPassword],
      principal: [user?.config?.config?.principal ?? user?.config?.principal ?? ''],
      extras: [((user?.config?.config?.extras ?? user?.config?.extras) ?? []).join(', ')],
      roleIds: [pre],
    });
  }

  guardar(): void {
    const roleIds = (this.form.get('roleIds')?.value ?? []) as number[];

    const payloadUser = {
      srl_emp: this.form.get('catEmpleadoId')?.value ?? null,
      user: this.form.get('username')?.value ?? null,
      area: this.form.get('area')?.value ?? null,
      task: this.form.get('task')?.value ?? null,
      active: this.form.get('active')?.value ?? true,
      roles: roleIds,
      principal: this.form.get('principal')?.value ?? null,
      extras: String(this.form.get('extras')?.value ?? '')
        .split(',')
        .map(x => x.trim())
        .filter(Boolean),
    };

    this.ref.close({
      userPatch: payloadUser,
      selectedRoleIds: roleIds,
    });
  }


  toggleRole(roleId: number, checked: boolean) {
    if (checked) this.selectedRoleIdsSet.add(roleId);
    else this.selectedRoleIdsSet.delete(roleId);
  }

  asignarRoles(userId: number, roleIds: number[]): void {
    if (!this.empleadoActual?.id) return;
    const request: AssignRoleRequest = { userId, roleIds };
    this.loading = true;
    this.userService.getRoles().subscribe({
      next: () => {
        this.selectedRoles = [];
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  cerrar() {
    this.ref.close();
  }

}

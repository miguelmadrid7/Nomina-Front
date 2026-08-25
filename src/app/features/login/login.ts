import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { LoginService } from '../../core/services/login.service';
import { SidebarService } from '../../core/services/sidebar.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  private readonly router = inject(Router);
  private readonly loginService = inject(LoginService);
  private readonly sidebarService = inject(SidebarService);
  private readonly fb = inject(FormBuilder);
  private readonly toastService = inject(ToastService);

  loading = false;
  hide = true;

  readonly loginForm = this.fb.nonNullable.group({
    user: ['', Validators.required],
    password: ['', Validators.required],
  });

  // Acceso directo tipado — no necesita '!' ni casting
  get userControl() { 
    return this.loginForm.controls.user; 
  }

  get passwordControl() { 
    return this.loginForm.controls.password; 
  }

  login(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.loading = true;
    const credentials = this.loginForm.getRawValue();
    this.loginService.login(credentials).subscribe({
      next: (resp) => {
        const authHeader = resp.headers.get('Authorization');
          if (!authHeader) {
            this.toastService.error('Autenticación', 'No se recibió token de autenticación.', 6000);
            this.loading = false;
            return;
          }
        const token = authHeader.replace('Bearer ', '');
        this.loginService.setToken(token);
          if (resp.body?.data) {
            this.loginService.setSession(resp.body.data);
          }
        this.sidebarService.getModulesByUser().subscribe({
          next: (modules) => {
            this.loginService.setMenuModules(modules);
            const returnUrl = this.router.routerState.snapshot.root.queryParams['returnUrl'];
            this.router.navigate([returnUrl || this.loginService.getPrincipalRoute()]);
            this.loading = false;
          },
          error: () => {
            this.toastService.error('Módulos', 'No se pudieron cargar los módulos del usuario.', 6000);
            this.loading = false;
            this.router.navigate([this.loginService.getPrincipalRoute()]);
          }
        });
      },
      error: () => {
        this.toastService.error('Acceso denegado', 'Verifique su usuario y contraseña.', 6000);
        this.loading = false;
      }
    });
  }
}
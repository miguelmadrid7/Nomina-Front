import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { LoginService } from '../../core/services/login.service';
import { LoginPayload, LoginResponse } from '../../models/login.model';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    MatFormFieldModule,
    CommonModule,
    FormsModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  credentials: LoginPayload = {
    user: '',
    password: ''
  };
  loading: boolean = false;
  error: string = '';
  hide = true;

  constructor(
    private router: Router,
    private loginService: LoginService
  ) {}

  login(form?: NgForm) {
  this.error = '';
    if (form && form.invalid) {
      Object.values(form.controls).forEach(c => c.markAsTouched());
      return;
    }

  this.loading = true;
  this.loginService.login(this.credentials).subscribe({
    next: (resp) => {
      const authHeader = resp.headers.get('Authorization');
      if (authHeader) {
        const token = authHeader.replace('Bearer ', ''); // <- IMPORTANTE
        this.loginService.setToken(token);
        // Guardar roles y permisos del body
        if (resp.body?.data) {
          this.loginService.setSession(resp.body.data);
        }
            const returnUrl = this.router.routerState.snapshot.root.queryParams['returnUrl'];
            this.router.navigate([returnUrl || this.loginService.getPrincipalRoute()]);
            
          } else {
            this.error = 'No se recibió token de autenticación';
          }
            this.loading = false;
    },
    error: () => {
      this.error = 'Acceso denegado, verifique su usuario y contraseña';
      this.loading = false;
      }
    });
  }
}

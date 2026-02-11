import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { LoginService } from '../../services/login.service';
import { LoginPayload, LoginResponse } from '../../interfaces/login-inter';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


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

  constructor(
    private router: Router,
    private loginService: LoginService
  ) {}

  login () {
    this.loading = true;
    this.error = '';

    // src/app/components/login/login.ts (solo el método login)
    this.loginService.login(this.credentials).subscribe({
      next: (resp) => {
        const token = resp.headers.get('Authorization'); // viene SIN "Bearer "
        if (token) {
          this.loginService.setToken(token); // guarda el JWT crudo
          this.router.navigate(['/home']);
        } else {
          this.error = 'No se recibió token de autenticación';
          this.loading = false;
        }
      },
      error: () => {
        this.error = 'Acceso denegado, verifique su usuario y contraseña';
        this.loading = false;
      }
    });
  }

}

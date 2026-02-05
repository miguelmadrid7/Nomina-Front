import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../servicios/login.service';
import { LoginPayload, LoginResponse } from '../interfaces/login-inter';
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
    private authService: AuthService
  ) {}

  login () {
    this.loading = true;
    this.error = '';

    this.authService.login(this.credentials).subscribe({
      next: (response: LoginResponse) => {
        if(response.token){
          this.authService.setToken(response.token);
          this.router.navigate(['/home']);
        }
      },
      error: (err) => {
        this.error = 'Acceso denegado, verifique su usuario y contraseña';
        this.loading = false;
      }
    });
  }

}

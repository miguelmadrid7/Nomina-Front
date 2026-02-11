import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { LoginPayload, LoginResponse } from '../interfaces/login-inter';


@Injectable({ providedIn: 'root' })
export class LoginService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  login(payload: LoginPayload): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.base}/users/getToken`, payload, {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    // Validación opcional de expiración (si tu JWT tiene 'exp')
    try {
      const payload = JSON.parse(atob(token.split('.')[1] || ''));
      if (payload?.exp) {
        const nowSec = Math.floor(Date.now() / 1000);
        return payload.exp > nowSec;
      }
      return true; // si no hay exp, asumimos válido mientras exista
    } catch {
      return false;
    }
  }

  setToken(token: string) {
    localStorage.setItem('token', token);
  }

  getToken() {
    return localStorage.getItem('token');
  }

  logout() {
    localStorage.removeItem('token');
   }


}

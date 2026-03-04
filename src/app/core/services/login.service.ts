// src/app/services/login.service.ts
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { LoginPayload } from '../interfaces/login-inter';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class LoginService {
  private base = environment.apiUrl;
  private platformId = inject(PLATFORM_ID);

  constructor(private http: HttpClient) {}

  private isBrowser() {
    return isPlatformBrowser(this.platformId);
  }

  // Cambiar a /login y observar headers
  login(payload: LoginPayload): Observable<HttpResponse<any>> {
    return this.http.post(`${this.base}/login`, payload, {
      headers: { 'Content-Type': 'application/json' },
      observe: 'response'
    });
  }

  isAuthenticated(): boolean {
    if (!this.isBrowser()) return false;
    const token = this.getToken();
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1] || ''));
      if (payload?.exp) {
        const nowSec = Math.floor(Date.now() / 1000);
        return payload.exp > nowSec;
      }
      return true;
    } catch {
      return false;
    }
  }

  // SSR-safe
  setToken(token: string) {
    if (!this.isBrowser()) return;
    localStorage.setItem('token', token); // Guarda el JWT crudo (SIN "Bearer ")
  }

  getToken() {
    if (!this.isBrowser()) return null;
    return localStorage.getItem('token'); // Devuelve el JWT crudo
  }

  logout() {
    if (!this.isBrowser()) return;
    localStorage.removeItem('token');
  }
}
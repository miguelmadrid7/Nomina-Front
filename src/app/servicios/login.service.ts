import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { LoginPayload, LoginResponse } from '../interfaces/login-inter';


@Injectable({ providedIn: 'root' })
export class AuthService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  login(payload: LoginPayload): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.base}/users/getToken`, payload, {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  setToken(token: string) { localStorage.setItem('token', token); }
  getToken() { return localStorage.getItem('token'); }
  logout() { localStorage.removeItem('token'); }
}
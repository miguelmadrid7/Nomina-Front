// src/app/interceptors/auth.interceptor.ts
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { LoginService } from '../services/login.service';
import { environment } from '../../environments/environment';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const loginService = inject(LoginService);
  const token = loginService.getToken();

  const isAuthEndpoint = req.url.includes('/login');
  const isApiCall = req.url.startsWith(environment.apiUrl);
  const isPreflight = req.method === 'OPTIONS';

  let reqToSend = req;
  if (token && !isAuthEndpoint && isApiCall && !isPreflight) {
    reqToSend = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(reqToSend).pipe(
    catchError((err: HttpErrorResponse) => {
      // No redirigir por errores en preflight
      if (!isPreflight && (err.status === 401 || err.status === 403)) {
        loginService.logout();
        if (typeof window !== 'undefined') window.location.href = '/login';
      }
      return throwError(() => err);
    })
  );
};
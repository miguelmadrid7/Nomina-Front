// src/app/interceptors/auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { LoginService } from '../services/login.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const loginService = inject(LoginService);
  const token = loginService.getToken();

  const isAuthEndpoint = req.url.includes('/users/getToken'); // excluye login

  if (token && !isAuthEndpoint) {
    const authReq = req.clone(
      { 
        setHeaders: 
        { 
          Authorization: `Bearer ${token}` 
        } 
      }
    );
    return next(authReq);
  }
  return next(req);
};
import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, Router, UrlTree } from '@angular/router';
import { LoginService } from '../services/login.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate, CanActivateChild {
  constructor(private loginService: LoginService, private router: Router) {}

  canActivate(): boolean | UrlTree{
    return this.checkAuth();
  }

  canActivateChild(): boolean | UrlTree{
    return this.checkAuth();
  }

  private checkAuth(): boolean | UrlTree{
    if (this.loginService.isAuthenticated()) return true;
    this.router.navigate(['/login'], {
      queryParams: {
        returnUrl: this.router.routerState.snapshot.url
      }
    });
    return false;
  }
}

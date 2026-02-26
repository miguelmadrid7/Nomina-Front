import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanActivateChild, Router, UrlTree } from '@angular/router';
import { LoginService } from '../services/login.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate, CanActivateChild {

  constructor(private loginService: LoginService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    return this.checkAccess(route);
  }

  canActivateChild(route: ActivatedRouteSnapshot): boolean | UrlTree {
    return this.checkAccess(route);
  }

  private checkAccess(route: ActivatedRouteSnapshot): boolean | UrlTree {
  // 1. Validar autenticación
  if (!this.loginService.isAuthenticated()) {
    return this.router.createUrlTree(['/login'], {
      queryParams: {
          returnUrl: this.router.routerState.snapshot.url
        }
      });
    }

    // 2. Validar roles si la ruta los define
    const requiredRoles = route.data['roles'] as number[] | undefined;
    if (requiredRoles && requiredRoles.length > 0) {
      const userRoles = this.loginService.getRoles();
      const hasAccess = requiredRoles.some(role =>
        userRoles.includes(role)
      );

      if (!hasAccess) {
        // Usuario autenticado pero sin permisos
        return this.router.createUrlTree(['/home']);
      }
    }

    return true;
  }
}


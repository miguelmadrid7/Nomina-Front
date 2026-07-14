import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanActivateChild, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { LoginService } from '../services/login.service';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { SidebarService } from '../services/sidebar.service';
import { SidebarModule } from '../model/sidebar.model';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate, CanActivateChild {

  constructor(private loginService: LoginService, private router: Router, private sidebarService: SidebarService) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree | Observable<boolean | UrlTree> {
    return this.checkAccess(state.url);
  }

  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree | Observable<boolean | UrlTree> {
    return this.checkAccess(state.url);
  }

  private checkAccess(url: string): boolean | UrlTree | Observable<boolean | UrlTree> {
  if (!this.loginService.isAuthenticated()) {
    return this.router.createUrlTree(['/login'], {
      queryParams: {
          returnUrl: url
        }
      });
    }
    const currentUrl = this.normalizePath(url);
    if (currentUrl === '/home') {
      return true;
    }

    const cachedModules = this.loginService.getMenuModules();
    if (cachedModules.length > 0) {
      return this.canAccessUrl(cachedModules, currentUrl) ? true : this.router.createUrlTree(['/home']);
    }

    return this.sidebarService.getModulesByUser().pipe(
      map(modules => {
        this.loginService.setMenuModules(modules);
        return this.canAccessUrl(modules, currentUrl) ? true : this.router.createUrlTree(['/home']);
      }),
      catchError(() => of(this.router.createUrlTree(['/home'])))
    );
  }

  private canAccessUrl(modules: SidebarModule[], currentUrl: string): boolean {
    return modules.some(module => {
      const modulePath = this.normalizePath(module.path ?? module.config);
      return !!modulePath && module.vista && modulePath === currentUrl;
    });
  }

  private normalizePath(path: string | null | undefined): string {
    if (!path) return '';
    const cleanPath = path.split('?')[0].split('#')[0].trim();
    if (!cleanPath) return '';
    return cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
  }
}


import { Component } from '@angular/core';
import {RouterLink} from '@angular/router';
import { LoginService } from '../../core/services/login.service';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar {

  constructor(private loginService: LoginService) {}
  
  hasAnyRole(roles: number[]): boolean {
    return this.loginService.hasAnyRole(roles);
  }

  hasPermiso(nombre: string): boolean {
    return this.loginService.hasPermiso(nombre);
  }

  hasModule(moduleId: number): boolean {
    return this.loginService.hasModule(moduleId);
  }

}

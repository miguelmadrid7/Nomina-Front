import { Component, Input } from '@angular/core';
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
  styleUrls: ['./sidebar.css']
})
export class Sidebar {

  collapsed = false;

  constructor(private loginService: LoginService) {}
  
   ngOnInit(): void {
    const saved = localStorage.getItem('sidebar-collapsed');
    this.collapsed = saved === 'true';
  }

  toggle(): void {
    this.collapsed = !this.collapsed;
    localStorage.setItem('sidebar-collapsed', String(this.collapsed));
  }

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

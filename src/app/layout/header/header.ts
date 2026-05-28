import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LoginService } from '../../core/services/login.service';
import { RolService } from '../../core/services/rol.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule, 
  ],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class Header implements OnInit{

  @Output() toggleSidebarClick = new EventEmitter<void>();
  roleName: string | null = null;

  constructor(private loginService: LoginService, private rolService: RolService, private router: Router,) {}

  ngOnInit(): void {
    // Suscríbete a los cambios de rol
    this.loginService.getRoleChanged().subscribe(roleId => {
      if (roleId) {
        this.rolService.getRole(roleId).subscribe(role => {
          this.roleName = role?.name || 'Rol desconocido';
        });
      }
    });

    // Inicializa por si ya hay rol guardado
    const roles = this.loginService.getRoles();
    if (roles && roles.length > 0) {
      this.rolService.getRole(roles[0]).subscribe(role => {
        this.roleName = role?.name || 'Rol desconocido';
      });
    }
  }
  
  onToggleClick() { 
    this.toggleSidebarClick.emit(); 
  }

  logout(): void {
    this.loginService.logout();
    this.router.navigate(['/login'], { replaceUrl: true });
  }

}

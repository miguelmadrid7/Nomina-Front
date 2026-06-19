import { ChangeDetectorRef, Component, EventEmitter, inject, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LoginService } from '../../core/services/login.service';
import { RolService } from '../../core/services/rol.service';
import { MatDialog } from '@angular/material/dialog';

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
  roleName: string = '';


  private readonly loginService = inject(LoginService);
  private readonly rolService = inject(RolService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly dialog = inject(MatDialog);

  ngOnInit(): void {
    // Suscríbete a los cambios de rol
    this.loginService.getRoleChanged().subscribe(roleId => {
      if (roleId) {
        this.rolService.getRole(roleId).subscribe(role => {
          this.roleName = role?.name || 'Rol desconocido';
          this.cdr.detectChanges();
        });
      }
    });

    // Inicializa por si ya hay rol guardado
    const roles = this.loginService.getRoles();
    if (roles && roles.length > 0) {
      this.rolService.getRole(roles[0]).subscribe(role => {
        this.roleName = role?.name || 'Rol desconocido';
        this.cdr.detectChanges();
      });
    }
  }
  
  onToggleClick() { 
    this.toggleSidebarClick.emit(); 
  }

  logout(): void {
    this.dialog.closeAll();
    this.loginService.logout();
    this.router.navigate(['/login'], { replaceUrl: true });
  }

}

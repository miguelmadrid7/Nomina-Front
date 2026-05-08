import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LoginService } from '../../core/services/login.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule, 
  ],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class Header {

  @Output() toggleSidebarClick = new EventEmitter<void>();

  constructor(
    private loginService: LoginService,
    private router: Router,
  ) {}
  
  onToggleClick() { 
    this.toggleSidebarClick.emit(); 
  }

  logout(): void {
    this.loginService.logout();
    this.router.navigate(['/login'], { replaceUrl: true });
  }

}

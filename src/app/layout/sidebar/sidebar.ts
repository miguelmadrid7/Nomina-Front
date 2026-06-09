import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { LoginService } from '../../core/services/login.service';
import { SidebarService } from '../../core/services/sidebar.service';
import { SidebarGroup, SidebarModule } from '../../models/sidebar.model';

@Component({
  selector: 'sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  animations: [
    trigger('expandCollapse', [
      state('open', style({ height: '*', opacity: 1, overflow: 'hidden' })),
      state('closed', style({ height: '0px', opacity: 0, overflow: 'hidden' })),
      transition('open <=> closed', animate('220ms ease')),
    ])
  ]
})
export class Sidebar implements OnInit {

  private readonly loginService   = inject(LoginService);
  private readonly router         = inject(Router);
  private readonly sidebarService = inject(SidebarService);

  collapsed  = false;
  menuGroups: SidebarGroup[] = [];

  ngOnInit(): void {
    const saved    = localStorage.getItem('sidebar-collapsed');
    this.collapsed = saved === 'true';
    this.loadMenu();
  }

  loadMenu(): void {
    const cached = this.loginService.getMenuModules();

    if (cached.length > 0) {
      this.menuGroups = this.buildGroups(cached);
      return;
    }

    this.sidebarService.getModulesByUser().subscribe({
      next: (modules) => {
        this.loginService.setMenuModules(modules);
        this.menuGroups = this.buildGroups(modules);
      },
      error: () => {
        this.menuGroups = [];
      }
    });
  }

  private buildGroups(modules: SidebarModule[]): SidebarGroup[] {
    const visibleModules = modules.filter(m => m.vista);
    const groupsMap      = new Map<number, SidebarGroup>();

    for (const module of visibleModules) {
      const isParent = module.parentId === null || module.moduleId === module.parentId;
        if (isParent) {
          if (!groupsMap.has(module.moduleId)) {
            groupsMap.set(module.moduleId, {
              parentId: module.moduleId,
              parentName: module.moduleName,
              icon: module.icon || 'fa-solid fa-folder',
              expanded: true,  
              children: []
            });
          }
          continue;
        }

      const groupId = module.parentId;
      if (groupId === null) continue;
      if (!groupsMap.has(groupId)) {
        groupsMap.set(groupId, {
          parentId: groupId,
          parentName: module.parentName || 'Sin categoría',
          icon: 'fa-solid fa-folder',
          expanded:   true,
          children:   []
        });
      }
      groupsMap.get(groupId)?.children.push(module);
    }
    return Array.from(groupsMap.values()).filter(g => g.children.length > 0);
  }

  toggleGroup(group: SidebarGroup): void {
    group.expanded = !group.expanded;
  }

  resolveRoute(item: SidebarModule): string {
    return item.path || item.config || '/home';
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

  logout(): void {
    this.loginService.logout();
    this.router.navigate(['/login'], { replaceUrl: true });
  }
}
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink} from '@angular/router';
import { LoginService } from '../../core/services/login.service';
import { CommonModule } from '@angular/common';
import { SidebarGroup, SidebarModule } from '../../models/sidebar.model';
import { SidebarService } from '../../core/services/sidebar.service';


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
export class Sidebar implements OnInit{

  collapsed = false;
  menuGroups: SidebarGroup[] = [];

  constructor(private loginService: LoginService, private router: Router, private sideBarService: SidebarService) {}
  
    ngOnInit(): void {
      const saved = localStorage.getItem('sidebar-collapsed');
      this.collapsed = saved === 'true';
      this.loadMenu();
    }

    loadMenu(): void {
      const cached = this.loginService.getMenuModules();
      if (cached.length > 0) {
        this.menuGroups = this.buildGroups(cached);
        return;
      }

      this.sideBarService.getModulesByUser().subscribe({
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
    const groupsMap = new Map<number, SidebarGroup>();

    for (const module of visibleModules) {
      const isParent = module.parentId === null || module.moduleId === module.parentId;

      if (isParent) {
        if (!groupsMap.has(module.moduleId)) {
          groupsMap.set(module.moduleId, {
            parentId: module.moduleId,
            parentName: module.moduleName,
            icon: module.icon || 'fa-solid fa-folder',
            children: []
          });
        }

        continue;
      }

      const groupId = module.parentId;

      if (groupId === null) {
        continue;
      }

      if (!groupsMap.has(groupId)) {
        groupsMap.set(groupId, {
          parentId: groupId,
          parentName: module.parentName || 'Sin categoría',
          icon: 'fa-solid fa-folder',
          children: []
        });
      }

      groupsMap.get(groupId)?.children.push(module);
    }

    return Array.from(groupsMap.values()).filter(group => group.children.length > 0);
  }

    resolveRoute(config: string | null): string {
      return config || '/home';
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

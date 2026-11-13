import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { LoginService } from '../../core/services/login.service';
import { SidebarService } from '../../core/services/sidebar.service';
import { SidebarModule, SidebarNode } from '../../core/model/sidebar.model';

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

  private readonly loginService = inject(LoginService);
  private readonly router = inject(Router);
  private readonly sidebarService = inject(SidebarService);

  collapsed = false;
  menu: SidebarNode[] = [];

  ngOnInit(): void {
    const saved    = localStorage.getItem('sidebar-collapsed');
    this.collapsed = saved === 'true';
    this.loadMenu();
  }

  loadMenu(): void {
    const cached = this.loginService.getMenuModules();

    if (cached.length > 0) {
      this.menu = this.buildTree(cached);
      return;
    }

    this.sidebarService.getModulesByUser().subscribe({
      next: (modules) => {
        this.loginService.setMenuModules(modules);
        this.menu = this.buildTree(modules);
      },
      error: () => {
        this.menu = [];
      }
    });
  }

  private buildTree(modules: SidebarModule[]): SidebarNode[] {
    const visibles = modules.filter(m => m.vista);
    const nodos = new Map<number, SidebarNode>();
    const padreDe = new Map<number, number | null>();

    for (const m of visibles) {
      nodos.set(m.moduleId, {
        id: m.moduleId,
        name: m.moduleName,
        icon: m.icon || 'fa-solid fa-circle',
        route: m.path || m.config || null,
        children: []
      });
      const esRaiz = m.parentId === null || m.parentId === m.moduleId;
      padreDe.set(m.moduleId, esRaiz ? null : m.parentId);
    }

    // Si el padre no vino en la respuesta (rol sin ese módulo), carpeta de respaldo
    for (const m of visibles) {
      const pid = padreDe.get(m.moduleId);
      if (pid != null && !nodos.has(pid)) {
        nodos.set(pid, {
          id: pid,
          name: m.parentName || 'Sin categoría',
          icon: 'fa-solid fa-folder',
          route: null,
          children: []
        });
        padreDe.set(pid, null);
      }
    }

    const raiz: SidebarNode[] = [];
    nodos.forEach((nodo, id) => {
      const pid = padreDe.get(id);
      pid != null ? nodos.get(pid)!.children.push(nodo) : raiz.push(nodo);
    });

    // En la raíz solo grupos con hijos (igual que antes)
    return this.podar(raiz).filter(n => n.children.length > 0);
  }

  // Quita agrupadores vacíos y hojas sin ruta, en cualquier nivel
  private podar(nodos: SidebarNode[]): SidebarNode[] {
    return nodos
      .map(n => ({ ...n, children: this.podar(n.children) }))
      .filter(n => n.route || n.children.length > 0);
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
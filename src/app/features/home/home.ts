import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, ActivatedRoute, NavigationEnd, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Sidebar } from '../../layout/sidebar/sidebar';
import { ThemeSelector } from '../../layout/theme-selector/theme-selector';
import { Header } from '../../layout/header/header';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    Sidebar,
    ThemeSelector,
    Header,
    RouterModule,
  ],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class Home {

    @ViewChild(Sidebar) sidebar!: Sidebar;
    breadcrumbs: { label: string, url: string }[] = [];
    isSidebarCollapsed = true;

    constructor(
      private router: Router,
      private route: ActivatedRoute
    ) {

      this.router.events
        .pipe(filter(event => event instanceof NavigationEnd))
        .subscribe(() => {
          this.breadcrumbs = this.buildBreadCrumb(this.route.root);
        });

    }

  ngAfterViewInit(): void {
      // Inicializa el estado del sidebar según el componente Sidebar
      this.isSidebarCollapsed = this.sidebar.collapsed;
    }

    buildBreadCrumb(
      route: ActivatedRoute,
      url: string = '',
      breadcrumbs: { label: string; url: string }[] = []
    ): { label: string; url: string }[] {

      const children = route.children;

      if (children.length === 0) return breadcrumbs;

      for (const child of children) {

        const routeURL = child.snapshot.url.map((s) => s.path).join('/');

        if (routeURL !== '') url += `/${routeURL}`;

        const label = child.snapshot.data['breadcrumb'];

        if (label) {
          breadcrumbs.push({
            label,
            url
          });
        }

        return this.buildBreadCrumb(child, url, breadcrumbs);
      }

      return breadcrumbs;
    }

  toggleSidebar(): void {
    this.sidebar.toggle();
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }
}

import { Home } from './features/home/home';
import { Routes } from '@angular/router';
import { Login } from '../app/features/login/login';
import { NominaExtraordinaria } from '../app/features/nomina/nomina-extraordinaria/nomina-extraordinaria';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full'},
  { path: 'login', component: Login},

  {
    path: 'home',
    component: Home,
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],
    data: { breadcrumb: 'Home' },
    children: [
      {
        path: 'empleados/list',
        loadComponent: () =>
          import('./features/catalogos/empleado/list-empleado/list-empleado')
            .then(m => m.ListEmpleado),
        data: { breadcrumb: 'Empleados lista' }
      },
      {
        path: 'empleados/form',
        loadComponent: () =>
          import('./features/catalogos/empleado/form-empleado/form-empleado')
            .then(m => m.FormEmpleado),
        data: { breadcrumb: 'Empleados formulario' }
      },
      {
        path: 'usuarios',
        data: { breadcrumb: 'Usuarios' },
        children: [
          {    
            path: 'gestion-usuarios',
            loadComponent: () =>
              import('./features/gestion-usuarios/gestion-usuarios/gestion-usuarios')
                .then(m => m.GestionUsuarios),
            data: { roles: [1], breadcrumb: 'Gestión usuarios' }
          },
          {    
            path: 'roles-usuarios',
            loadComponent: () =>
              import('./features/gestion-usuarios/gestion-role-usuarios/gestion-role-usuarios')
                .then(m => m.GestionRoleUsuarios),
            data: { roles: [1], breadcrumb: 'Roles usuarios' }
          },
        ]
      },
      {
        path: 'nomina',
        data: { breadcrumb: 'Nómina' },
        children: [
          {
            path: 'calculo-nomina-ordinaria',
            loadComponent: () =>
              import('./features/nomina/calculo-nomina/calculo-nomina.component')
                .then(m => m.CalculoNominaComponent),
            data: { roles: [1], breadcrumb: 'Cálculo nómina ordinaria' }
          },
          {
            path: 'ordinaria',
            loadComponent: () =>
              import('./features/nomina/nomina-ordinaria/nomina-ordinaria')
                .then(m => m.NominaOrdinaria),
            data: { roles: [1], breadcrumb: 'Visualizar nómina ordinaria' }
          },
          {
            path: 'extraordinaria',
            loadComponent: () =>
              import('./features/nomina/nomina-extraordinaria/nomina-extraordinaria')
                .then(m => m.NominaExtraordinaria),
            data: { roles: [1], breadcrumb: 'Cálculo nómina extraordinaria' }
          },
          {
            path: 'generar-producto',
            loadComponent: () =>
              import('./features/nomina/generar-producto/generar-producto.component')
                .then(m => m.GenerarProductoComponent),
            data: { roles: [1], breadcrumb: 'Generar producto' }
          }
        ]
      },

      {
        path: 'pensiones',
        data: { breadcrumb: 'Pensiones' },
        children: [
          {
            path: 'registro-alimenticia',
            loadComponent: () =>
              import('./features/nomina/pension-alimenticia/pension-alimenticia')
                .then(m => m.PensionAlimenticia),
            data: { roles: [1], breadcrumb: 'Pensión alimenticia' }
          },
        ]
      },

      {
        path: 'juicios/juicios-mercantiles',
        loadComponent: () =>
          import('./features/juicios/juicios-mercantiles/juicios-mercantiles')
            .then(m => m.JuiciosMercantiles),
        data: { roles: [1], breadcrumb: 'Juicios mercantiles' }
      },

      {
        path: 'terceros',
        data: { breadcrumb: 'Terceros' },
        children: [
          {    
            path: 'registro-terceros',
            loadComponent: () =>
              import('./features/terceros/terceros/terceros')
                .then(m => m.Terceros),
            data: { roles: [1, 3], breadcrumb: 'Registro terceros' }
          },
          {    
            path: 'consulta-terceros',
            loadComponent: () =>
              import('./features/terceros/consulta-terceros/consulta-terceros')
                .then(m => m.ConsultaTerceros),
            data: { roles: [1], breadcrumb: 'Consulta terceros' }
          },
          {    
            path: 'registro-terceros-institucionales',
            loadComponent: () =>
              import('./features/terceros/registro-tercero-institucional/registro-tercero-institucional')
                .then(m => m.RegistroTerceroInstitucional),
            data: { roles: [1], breadcrumb: 'Registro terceros institucionales' }
          },
        ]
      },
    ]
  },

  { path: '**', redirectTo: 'login' }
];

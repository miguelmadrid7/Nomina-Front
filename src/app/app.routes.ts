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
        data: { breadcrumb: 'Gestion' },
        children: [
          {    
            path: 'gestion-usuarios',
            loadComponent: () =>
              import('./features/gestion-core/gestion-usuarios/gestion-usuarios')
                .then(m => m.GestionUsuarios),
            data: { breadcrumb: 'Gestión usuarios' }
          },
          {    
            path: 'roles',
            loadComponent: () =>
              import('./features/gestion-core/gestion-role/gestion-role')
                .then(m => m.GestionRole),
            data: { breadcrumb: 'Roles usuarios' }
          },
          {    
            path: 'modulos',
            loadComponent: () =>
              import('./features/gestion-core/gestion-modulos/gestion-modulos')
                .then(m => m.GestionModulos),
            data: { breadcrumb: 'Módulos' }
          },
          {    
            path: 'iconos',
            loadComponent: () =>
              import('./features/gestion-core/gestion-icono/gestion-icono')
                .then(m => m.GestionIcono),
            data: { breadcrumb: 'Iconos' }
          },
          {    
            path: 'parametrizacion',
            loadComponent: () =>
              import('./features/gestion-core/gestion-parametrizacion/gestion-parametrizacion')
                .then(m => m.GestionParametrizacion),
            data: { breadcrumb: 'Parametrizacion' }
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
            data: { breadcrumb: 'Cálculo nómina ordinaria' }
          },
          {
            path: 'ordinaria',
            loadComponent: () =>
              import('./features/nomina/nomina-ordinaria/nomina-ordinaria')
                .then(m => m.NominaOrdinaria),
            data: { breadcrumb: 'Visualizar nómina ordinaria' }
          },
          {
            path: 'extraordinaria',
            loadComponent: () =>
              import('./features/nomina/nomina-extraordinaria/nomina-extraordinaria')
                .then(m => m.NominaExtraordinaria),
            data: { breadcrumb: 'Cálculo nómina extraordinaria' }
          },
          {
            path: 'generar-producto',
            loadComponent: () =>
              import('./features/nomina/generar-producto/generar-producto.component')
                .then(m => m.GenerarProductoComponent),
            data: { breadcrumb: 'Generar producto' }
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
              import('./features/pension-alimenticia/pension-alimenticia/pension-alimenticia')
                .then(m => m.PensionAlimenticia),
            data: { breadcrumb: 'Pensión alimenticia' }
          },
          {
            path: 'consulta-pension-alimenticia',
            loadComponent: () =>
              import('./features/pension-alimenticia/pension-alimenticia-consulta/pension-alimenticia-consulta')
                .then(m => m.PensionAlimenticiaConsulta),
            data: { breadcrumb: 'Consulta pensión alimenticia' }
          },
        ]
      },

      {
        path: 'juicios',
        data: { breadcrumb: 'Juicios' },
        children: [
          {
            path: 'juicios-mercantiles',
            loadComponent: () =>
              import('./features/juicios/juicios-mercantiles/juicios-mercantiles')
                .then(m => m.JuiciosMercantiles),
            data: { breadcrumb: 'Juicios mercantiles' }
          }
        ]
      },

      {
        path: 'terceros',
        data: { breadcrumb: 'Terceros' },
        children: [
          {    
            path: 'registro-terceros',
            loadComponent: () =>
              import('./features/terceros/registro-terceros-no-institucional/registro-terceros-no-institucional')
                .then(m => m.RegistroTercerosNoInstitucional),
            data: { breadcrumb: 'Registro terceros no institucionales' }
          },
          {    
            path: 'consulta-terceros',
            loadComponent: () =>
              import('./features/terceros/consulta-terceros/consulta-terceros')
                .then(m => m.ConsultaTerceros),
            data: { breadcrumb: 'Consulta terceros' }
          },
          {    
            path: 'registro-terceros-institucionales',
            loadComponent: () =>
              import('./features/terceros/registro-tercero-institucional/registro-tercero-institucional')
                .then(m => m.RegistroTerceroInstitucional),
            data: { breadcrumb: 'Registro terceros institucionales' }
          },
        ]
      },
    ]
  },

  { path: '**', redirectTo: 'login' }
];

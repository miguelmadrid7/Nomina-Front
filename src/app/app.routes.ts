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
                children: [

                    {
                        path: 'empleados/list',
                        loadComponent: () =>
                        import('./features/catalogos/empleado/list-empleado/list-empleado')
                            .then(m => m.ListEmpleado)
                    },

                    {
                        path: 'empleados/form',
                        loadComponent: () =>
                        import('./features/catalogos/empleado/form-empleado/form-empleado')
                            .then(m => m.FormEmpleado)
                    },

                    {
                        path: 'nomina/calculo-nomina-ordinaria',
                        loadComponent: () =>
                        import('./features/nomina/calculo-nomina/calculo-nomina.component')
                            .then(m => m.CalculoNominaComponent),
                            data: { roles: [1] }
                    },

                    {
                        path: 'nomina/ordinaria',
                        loadComponent: () =>
                        import('./features/nomina/nomina-ordinaria/nomina-ordinaria')
                            .then(m => m.NominaOrdinaria),
                            data: { roles: [1] }

                    },

                    {
                        path: 'nomina/extraordinaria',
                        loadComponent: () =>
                        import('./features/nomina/nomina-extraordinaria/nomina-extraordinaria')
                            .then(m => m.NominaExtraordinaria),
                            data: { roles: [1] }
                    },

                    {
                        path: 'nomina/',
                        component: NominaExtraordinaria
                    },

                    {
                        path: 'nomina/generar-producto',
                        loadComponent: () =>
                        import('./features/nomina/generar-producto/generar-producto.component')
                            .then(m => m.GenerarProductoComponent),
                            data: { roles: [1] }
                    },

                    {
                        path: 'pension/alimenticia',
                        loadComponent: () =>
                        import('./features/nomina/pension-alimenticia/pension-alimenticia')
                            .then(m => m.PensionAlimenticia),
                        data: { roles: [1] }
                    },

                    {
                        path: 'juicios/juicios-mercantiles',
                        loadComponent: () =>
                        import('./features/juicios/juicios-mercantiles/juicios-mercantiles')
                            .then(m => m.JuiciosMercantiles),
                        data: { roles: [1] }
                    },

                ]
        },

      { path: '**', redirectTo: 'login' }
];



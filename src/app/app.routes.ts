import { Home } from './features/home/home';
import { Routes } from '@angular/router';
import { FormEmpleado } from '../app/features/catalogos/empleado/form-empleado/form-empleado';
import { ListEmpleado } from '../app/features/catalogos/empleado/list-empleado/list-empleado';
import { Login } from '../app/features/login/login';
import { NominaOrdinaria } from '../app/features/nomina/nomina-ordinaria/nomina-ordinaria';
import { NominaExtraordinaria } from '../app/features/nomina/nomina-extraordinaria/nomina-extraordinaria';
import { PensionAlimenticia } from './features/nomina/pension-alimenticia/pension-alimenticia';
import { AuthGuard } from './core/guards/auth.guard';
import { CalculoNominaComponent } from '../app/features/nomina/calculo-nomina/calculo-nomina.component';
import { GenerarProductoComponent } from '../app/features/nomina/generar-producto/generar-producto.component';

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

                ]
        },

      { path: '**', redirectTo: 'login' }
];



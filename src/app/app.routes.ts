import { Home } from '../app/components/home/home';
import { Routes } from '@angular/router';
import { FormEmpleado } from '../app/components/catalogos/empleado/form-empleado/form-empleado';
import { ListEmpleado } from '../app/components/catalogos/empleado/list-empleado/list-empleado';
import { Login } from '../app/components/login/login';
import { NominaOrdinaria } from '../app/components/nomina/nomina-ordinaria/nomina-ordinaria';
import { NominaExtraordinaria } from '../app/components/nomina-extraordinaria/nomina-extraordinaria';
import { PensionAlimenticia } from '../app/components/pension-alimenticia/pension-alimenticia';
import { AuthGuard } from './auth/auth.guard';
import { CalculoNominaComponent } from './components/nomina/calculo-nomina/calculo-nomina.component';
import { GenerarProductoComponent } from './components/nomina/generar-producto/generar-producto.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full'},
  { path: 'login', component: Login},

        {
            path: 'home',
            component: Home,
            canActivate: [AuthGuard],
            canActivateChild: [AuthGuard],
                children: [
    
                  { path: 'empleados/list', component: ListEmpleado},
                  { path: 'empleados/form', component: FormEmpleado},

                    {
                        path: 'nomina/calculo',
                        component: CalculoNominaComponent
                    },

                    {
                        path: 'nomina/ordinaria',
                        component: NominaOrdinaria
                    },

                    {
                        path: 'nomina/extraordinaria',
                        component: NominaExtraordinaria
                    },

                    {
                        path: 'nomina/',
                        component: NominaExtraordinaria
                    },

                    {
                        path: 'nomina/generar-producto',
                        component: GenerarProductoComponent
                    },

                    {
                        path: 'pension/alimenticia',
                        component: PensionAlimenticia
                    },

                ]
        },
        
      { path: '**', redirectTo: 'login' }
];



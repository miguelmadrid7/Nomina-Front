import { Home } from './home/home';

import { Routes } from '@angular/router';
import { FormEmpleado } from './catalogos/empleado/form-empleado/form-empleado';
import { ListEmpleado } from './catalogos/empleado/list-empleado/list-empleado';
import { Login } from './login/login';
import { NominaOrdinaria } from './nomina-ordinaria/nomina-ordinaria';
import { NominaExtraordinaria } from './nomina-extraordinaria/nomina-extraordinaria';
import { PensionAlimenticia } from './pension-alimenticia/pension-alimenticia';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full'},
    { path: 'login', component: Login},
    
        { 
            path: 'home', 
            component: Home,
                children: [
                    { path: 'empleados/list', component: ListEmpleado},
                    { path: 'empleados/form', component: FormEmpleado},
                    
                    { 
                        path: 'nomina/ordinaria', 
                        component: NominaOrdinaria
                    },

                    { 
                        path: 'nomina/extraordinaria', 
                        component: NominaExtraordinaria
                    },

                    { 
                        path: 'pension/alimenticia', 
                        component: PensionAlimenticia
                    },

                ]
        }
];



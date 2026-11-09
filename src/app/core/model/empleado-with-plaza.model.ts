import { PlazaEmpleado } from "./incidencias-inasistencias/plaza-empleado.model";

export interface EmpleadoWithPlaza {
    id: number;
    rfc: string;
    curp: string;
    nombre: string;
    primerApellido: string;
    segundoApellio: string;
    nombreCompleto: string;
    plazas: PlazaEmpleado[];
}
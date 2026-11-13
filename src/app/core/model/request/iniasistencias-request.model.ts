export interface IncidenciasInasistenciasRequest {
    folio: number;
    ejercicio: number;
    qnaProceso: number;
    fechaInasistencia: string;
    tipoInasistencia: string;
    horasInasistencia: number;
    tabEmpleadosId: number;
    tabPlazasId: number;
    importe: number;
}
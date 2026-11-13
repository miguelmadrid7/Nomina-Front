import { InasistenciaLoteDetalleRequest } from "./inasistencia-lote-detalle-request.model";

export interface InasistenciaLoteRequest {
    folio: number;
    ejercicio: number;
    qnaProceso: number;
    tabEmpleadoId: number;
    inasistencias: InasistenciaLoteDetalleRequest[];
}
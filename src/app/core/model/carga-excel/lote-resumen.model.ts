export interface LoteResumen {
    conceptoDescuento: string;
    qnaProceso: number;
    totalFilas: number;
    aceptadas: number;
    rechazadas: number;
    pendientesValidar: number;
    fechaCarga: string;
}
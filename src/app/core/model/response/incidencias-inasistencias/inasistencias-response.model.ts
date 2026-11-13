export interface InasistenciasResponse {
    id: number;
    folio: number;
    ejercicio: number;
    qna_proceso: number;
    fecha_inasistencia: string;
    tipo_inasistencia: string;
    horas_inasistencia: number;
    tab_empleados_id: number;
    tab_plazas_id: number;
    importe_descuento: number | null;
    nom_inasistencia_id: number | null;
}
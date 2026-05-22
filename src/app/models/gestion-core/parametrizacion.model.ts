export interface Parametrizacion {
    id?: number;
    importeDiario: number;
    importeMensual: number;
    qnaInicio: number;
    qnaFin: number;
}

export interface ParametrizacionRequest {
    importeDiario: number;
    importeMensual: number;
    qnaInicio: number;
    qnaFin: number;
}
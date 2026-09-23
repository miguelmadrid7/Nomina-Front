export interface Calendario {
    id: number;
    ejercicio: number;
    qna: number;
    tipo: string;
    fechaCierre: string;
    fechaPago: string;
    movimientos: boolean;
    pension: boolean;
    juicios: boolean;
    terceros: boolean;
    activa: boolean;
}
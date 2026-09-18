export type TerceroRowStatus = 'ACEPTADO' | 'RECHAZADO';

export interface TerceroRow {
  id: number;
  rfc: string;
  curp: string | null;
  nombreTrabajador: string | null;
  numeroDocumento: string | null;
  tipoMovimiento: number | null;
  importeMensual: number | null;
  conceptoDescuento: string;
  qnaProceso: number;
  desde: number | null;
  qnaIni: number | null;
  qnaFin: number | null;
  nomEmpPzaCptoId: number | null;
  formatoOrigen: string | null;
  lineaOrigen: number;
  parametrosOrigen: string | null;
  registroOrigen: string | null;
  estatus: TerceroRowStatus | null;
  motivoRechazo: string | null;
  fechaRegistro: string;
}
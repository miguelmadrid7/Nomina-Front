export interface TerceroRegistroRequest {
  rfc: string;
  nombreTrabajador: string | null;
  numeroDocumento: string | null;
  tipoMovimiento: number | null;
  importeMensual: number;
  desde: number | null;
}
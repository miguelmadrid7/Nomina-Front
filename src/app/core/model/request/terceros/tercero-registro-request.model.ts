export interface TerceroRegistroRequest {
  rfc: string;
  curp?: string | null;
  nombreTrabajador: string | null;
  numeroDocumento: string | null;
  tipoMovimiento: number | null;
  importeMensual: number;
  desde: number | null;
  hasta?: number | null;
}
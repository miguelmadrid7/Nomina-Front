export interface PersonalizarRow {
  id: number;
  qnaProceso: number;
  conceptoDescuento: string;
  rfc: string;
  curp: string;
  nombreTrabajador: string;
  cantidad: number;
  importe: number;
  estatus: string | null;
  motivoRechazo: string | null;
}
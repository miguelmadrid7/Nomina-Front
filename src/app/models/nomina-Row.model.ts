export interface NominaRow {
  noComprobante: number | string;
  ur: string;
  periodo: string;
  qnaProceso: number | null;
  tipoNomina: string;
  clavePlaza: string;
  curp: string;
  rfc: string;
  nombreEmpleado: string;
  tipoConcepto: string;
  concepto: string;
  descConcepto: string;
  importe: number;
  baseCalculoIsr: number;
  detalles?: Array<{
    noComprobante: number | string;
    tipoConcepto: string;
    concepto: string;
    importe: number;
  }>;
}

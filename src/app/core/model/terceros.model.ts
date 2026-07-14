export interface RegistroNp {
  rfc: string;
  nombreTrabajador?: string;
  numeroDocumento?: number;     // Long en Java => number en TS
  tipoOrden: number;            // 1,2,3
  importeMensual: number;       // BigDecimal => number en TS
  concepto: string;             // cve (ej: 'NP', '5L', '6L', '21')
  qnaProceso: number;           // requerido
  desde?: number | null;
  qnaIni?: number | null;
  qnaFin?: number | null;
}
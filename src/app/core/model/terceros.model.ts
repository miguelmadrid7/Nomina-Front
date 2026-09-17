export interface RegistroNp {
  rfc: string;
  nombreTrabajador?: string;
  numeroDocumento?: number;     
  tipoOrden: number;           
  importeMensual: number;       
  concepto: string;             
  qnaProceso: number;          
  desde?: number | null;
  qnaIni?: number | null;
  qnaFin?: number | null;
}
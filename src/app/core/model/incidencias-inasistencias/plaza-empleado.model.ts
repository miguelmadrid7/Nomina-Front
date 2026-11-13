export interface PlazaEmpleado {
  id: number;
  cvePlaza: string;
  horas: number | null;
  qnaIni: number | null;
  qnaFin: number | null;
  importeDescuento: number | null;
  plazaJornada: boolean;
  tipoPlaza?: string | null; 
}
/** One processed load (concept + quincena + date). Shared by terceros and percepciones. */
export interface HistoricoCarga {
  concepto: string;
  qnaProceso: number;
  fechaCarga: string;
}
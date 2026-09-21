import { TerceroHistorico } from "./tercero-historico.model";

export interface TercerosHistoricoDialogData {
  historico: TerceroHistorico[];
  qnaProceso: number;
  concepto: string | null;
}
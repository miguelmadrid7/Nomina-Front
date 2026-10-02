import { Calendario } from "../calendario.model";
import { TercerosLote } from "./terceros-lote.model";

export interface ConsultaTercerosLotesDialogData {
  lotes: TercerosLote[];
  calendarioActual: Calendario | null;
}
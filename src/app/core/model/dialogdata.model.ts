import { Calendario } from "./calendario.model";
import { ParametrizacionResponse } from "./response/parametrizacion-response.model";

export interface DialogData {
  mode: 'create' | 'update';
  param?: ParametrizacionResponse;
  calendario?: Calendario;
}
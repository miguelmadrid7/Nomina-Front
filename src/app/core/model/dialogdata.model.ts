import { ParametrizacionResponse } from "./response/parametrizacion-response.model";

export interface DialogData {
  mode: 'create' | 'update';
  param?: ParametrizacionResponse;
}
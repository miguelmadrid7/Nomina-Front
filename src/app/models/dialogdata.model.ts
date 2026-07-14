import { ParametrizacionResponse } from "../core/model/response/parametrizacion-response.model";

export interface DialogData {
  mode: 'create' | 'update';
  param?: ParametrizacionResponse;
}
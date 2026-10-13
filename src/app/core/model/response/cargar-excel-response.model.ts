import { ErrorFormatoExcel } from "../error-formato-excel.model";

export interface CargarExcelResponse {
  omitidos: number;
  erroresFormato: ErrorFormatoExcel[];
  total: number; 
  totalFilasExcel: number;
  insertados: number;
  aceptados: number;  
  rechazados: number;  
  todosAceptados: boolean; 
}
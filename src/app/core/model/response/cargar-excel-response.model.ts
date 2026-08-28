import { ErrorFormatoExcel } from "../error-formato-excel.model";

export interface CargarExcelResponse {
  omitidos: number;
  erroresFormato: ErrorFormatoExcel[];
  totalFilasExcel: number;
  insertados: number;
}
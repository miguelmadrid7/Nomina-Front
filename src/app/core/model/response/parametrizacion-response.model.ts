export interface ParametrizacionResponse {
  id: number;
  anio: number;
  importeDiario: number;
  importeMensual: number;
  qnaInicio: number;
  qnaFin: number;
  deleted: boolean;
  usCreated: string | null;
  coreUserCreated: string | null;
  tsCreated: string | null;
  usDeleted: string | null;
  coreUserDeleted: string | null;
  tsDeleted: string | null;
  tsModified: string | null;
  usModified: string | null;
}
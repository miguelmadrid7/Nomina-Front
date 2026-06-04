export interface BeneficiarioRequest {
  tabEmpleadosId: number;
  tabBeneficiariosAlimId: number;
  formaAplicacion: 'P' | 'F';
  tipoPorcentaje?: 1 | 2 | 3;  
  tipoBase?: 'A' | 'B'; 
  factorImporte: number;
  importeTotal?: number | null; 
  aplicarDescuentoAguinaldo?: boolean;
  qnaini: number;
  qnafin: number;
  numeroDocumento: string | null;
  numeroBenef?: number;
  catBancoId?: number;
  numeroOficio?: string | null;
}
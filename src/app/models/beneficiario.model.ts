export interface BeneficiarioRequest {
  tabEmpleadosId: number;
  tabBeneficiariosAlimId: number;
  formaAplicacion: 'P' | 'C';
  factorImporte: number;
  qnaini: number;
  qnafin: number;
  numeroDocumento: string;
  numeroBenef?: number;
}

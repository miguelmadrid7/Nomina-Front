export interface FilaBeneficiario {
  id: number;
  tabBeneficiariosAlimId: number;
  nombreEmpleado: string;
  rfcEmpleado: string;
  nombreBeneficiario: string;   
  rfcReferencia: string;
  noBeneficiario: number;
  numeroOficio?: string;
  formaAplicacion: string;   
  factorImporte: string;   
  banco: string;   
  qna: string;  
  qnaIni: number;
  qnaFin: number;
  mostrarEmpleado?: boolean; 
  estatus: 'VIGENTE' | 'CANCELADO' | 'FINALIZADO';
}
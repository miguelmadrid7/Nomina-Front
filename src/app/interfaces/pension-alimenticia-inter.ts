export interface BeneficiarioAlimRequest {
  rfc: string;
  primerApellido: string;
  segundoApellido: string;
  nombre: string;
}

export interface BeneficiarioRequest {
  tabEmpleadosId: number;
  tabBeneficiariosAlimId: number;
  formaAplicacion: 'P' | 'F';
  factorImporte: number;
  qnaini: number;
  qnafin: number;
  numeroDocumento: string;
  numeroBenef?: number;
}

export interface IdResponse {
  id: number;
}


export interface Banco {
  id: number;
  banco: string;
}
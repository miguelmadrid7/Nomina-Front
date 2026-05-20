import { Banco } from "./banco.model";

export interface BeneficiarioRequest {
  tabEmpleadosId: number;
  tabBeneficiariosAlimId: number;
  formaAplicacion: 'P' | 'C';
  factorImporte: number;
  qnaini: number;
  qnafin: number;
  numeroDocumento: string;
  numeroBenef?: number;
  catBancoId: number;
}

export interface BeneficiarioDTO {
  id: number;       
  numeroBenef: number;  
  empleado?: {
    id: number;
    nombre: string;
    primerApellido: string;
    segundoApellido: string;
  };    
  tabEmpleadosId: number;      
  tabBeneficiariosAlimId: number;      
  formaAplicacion: 'P' | 'C';   
  factorImporte: number;      
  qnaini: number;       
  qnafin: number;      
  numeroDocumento: string;    
  banco?: Banco;   
  beneficiarioAlim?: BeneficiarioAlimDTO;
}

export interface BeneficiarioAlimDTO {
  id: number;
  nombre: string;
  primerApellido: string;
  segundoApellido: string;
  rfc: string;
}

export interface FilaBeneficiario {
  id: number;
  nombreEmpleado: string;
  nombreBeneficiario: string;   
  rfc: string;
  noBeneficiario: number;
  formaAplicacion: string;   
  factorImporte: string;   
  banco: string;   
  qna: string;   
}
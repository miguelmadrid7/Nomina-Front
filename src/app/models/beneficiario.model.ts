import { Banco } from "./banco.model";

export interface BeneficiarioDTO {
  id: number;       
  numeroBenef: number;  
  empleado?: {
    id: number;
    nombre: string;
    primerApellido: string;
    segundoApellido: string;
    rfc: string;
  };    
  tabEmpleadosId: number;      
  tabBeneficiariosAlimId: number;      
  formaAplicacion: 'P' | 'F';   
  factorImporte: number; 
  numeroOficio?: string;     
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
}
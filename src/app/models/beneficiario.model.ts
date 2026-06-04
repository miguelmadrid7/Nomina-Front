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

export interface BeneficiarioDetalleResponse {
  id: number;
  numero_benef: number;
  tab_empleado_id: number;
  tab_beneficiario_alim_id: number;
  forma_aplicacion: 'P' | 'F';
  factor_importe: number;
  qnaini: number;
  qnafin: number;
  numero_documento: string;
  cat_banco_id: number | null;
  nombre: string;
  primer_apellido: string;
  segundo_apellido: string;
  rfc: string;
  nombre_banco: string | null;
}
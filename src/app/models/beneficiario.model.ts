import { Banco } from "./banco.model";

export interface BeneficiarioRequest {
  tabEmpleadosId: number;
  tabBeneficiariosAlimId: number;
  formaAplicacion: 'P' | 'C';
  factorImporte: number;
  qnaini: number;
  qnafin: number;
  numeroDocumento: string | null;
  numeroBenef?: number;
  catBancoId?: number;
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
  tabBeneficiariosAlimId: number;
  nombreEmpleado: string;
  nombreBeneficiario: string;   
  rfc: string;
  noBeneficiario: number;
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
  forma_aplicacion: 'P' | 'C';
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
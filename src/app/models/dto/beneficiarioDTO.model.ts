import { Banco } from "../banco.model";
import { BeneficiarioAlimDTO } from "../dto/beneficiarioalimDTO.model";

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

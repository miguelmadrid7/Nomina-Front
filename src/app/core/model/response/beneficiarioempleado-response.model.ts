import { BeneficiarioDTO } from "../../model/dto/beneficiarioDTO.model";

export interface BeneficiarioEmpleadoResponse {
  empleadoId: number;
  beneficiarios: BeneficiarioDTO[];
  porcentajeAcumulado: number;
  porcentajeDisponible: number;
}
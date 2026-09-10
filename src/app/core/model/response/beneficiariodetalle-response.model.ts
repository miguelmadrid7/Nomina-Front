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
import { PersonalizarRow } from "../personalizar-row.model";

export interface PersonalizarListResponse {
  content: PersonalizarRow[];
  totalElements: number;
  totalPages: number;
}
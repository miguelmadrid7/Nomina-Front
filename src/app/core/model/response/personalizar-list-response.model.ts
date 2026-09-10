import { PersonalizarRow } from "../personzaliza-row.model";

export interface PersonalizarListResponse {
  content: PersonalizarRow[];
  totalElements: number;
  totalPages: number;
}
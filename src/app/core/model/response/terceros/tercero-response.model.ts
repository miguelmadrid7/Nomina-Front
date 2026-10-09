import { TerceroRow } from '../../terceros/tercero-row.model';

export interface TerceroResponse {
  content: TerceroRow[];
  totalElements: number;
  totalPages: number;
}
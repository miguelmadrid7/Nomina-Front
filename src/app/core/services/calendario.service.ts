import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../core/model/response/api-Response.model';
import { Calendario } from '../model/calendario.model';
import { ConceptoExtra } from '../model/concepto-extra.model';

@Injectable({ providedIn: 'root' })
export class CalendarioService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

    getCalendarioQna(ejercicio?: number): Observable<ApiResponse<Calendario[]>> {
        const url = ejercicio != null
            ? `${this.base}/calendario?ejercicio=${ejercicio}`
            : `${this.base}/calendario`;
        return this.http.get<ApiResponse<Calendario[]>>(url);
    }

    getQnaActiva(): Observable<ApiResponse<Calendario>> {
        return this.http.get<ApiResponse<Calendario>>(`${this.base}/calendario/activa`);
    }

    getCalendarioById(id: number): Observable<ApiResponse<Calendario>> {
        return this.http.get<ApiResponse<Calendario>>(`${this.base}/calendario/${id}`);
    }

    getConceptosExtra(): Observable<ApiResponse<ConceptoExtra[]>> {
        return this.http.get<ApiResponse<ConceptoExtra[]>>(`${this.base}/calendario/conceptos-extra`);
    }

    addCalendario(payload: Omit<Calendario, 'id'>): Observable<ApiResponse<boolean>> {
        return this.http.post<ApiResponse<boolean>>(`${this.base}/calendario`, payload);
    }

    updateCalendario(id: number, payload: Omit<Calendario, 'id'>): Observable<ApiResponse<boolean>> {
        return this.http.put<ApiResponse<boolean>>(`${this.base}/calendario/${id}`, payload);
    }
}
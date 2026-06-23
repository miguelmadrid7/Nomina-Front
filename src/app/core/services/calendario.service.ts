import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../models/response/api-Response.model';
import { Calendario } from '../../models/calendario.model';

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

    addCalendario(payload: Omit<Calendario, 'id'>): Observable<ApiResponse<boolean>> {
        return this.http.post<ApiResponse<boolean>>(`${this.base}/calendario`, payload);
    }
}
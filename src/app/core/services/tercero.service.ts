import { Injectable  } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { map, Observable } from 'rxjs';
import { ApiResponse } from '../../models/api-Response.model';
import { Empleado } from '../../features/servicios/empleado';

@Injectable({ providedIn: 'root' })
export class TerceroService {

    private base = environment.apiUrl;
    constructor(private http: HttpClient) {}

    //Buscador para search del empleado
    searchEmployees(search: string): Observable<Empleado[]> {
      const q = encodeURIComponent(search.trim());
      return this.http.get<ApiResponse<Empleado[]>>(`${this.base}/employee/by/${q}/search`) .pipe(map(res => res.data ?? []));
    }

    // Se obtienen los conceptos de la bd
    obtenerConceptos(): Observable<any> {
      return this.http.get<any>(`${this.base}/tercero/conceptos`);
    }

    //Se guarda el formulario en la bd
    guardarTercero(payload: any): Observable<ApiResponse<any>> {
      return this.http.post<ApiResponse<any>>(`${this.base}/tercero/guardar`, payload);
    }

    getNominaChequ(): Observable<ApiResponse<any[]>> {
      return this.http.get<ApiResponse<any[]>>(`${this.base}/calculation/nomina-cheque`);
    }

    getNominaCheque(anio?: number, qna?: number, rfc?: string, curp?: string) {
      const params: Record<string, string> = {};
        if (anio != null) params['anio'] = String(anio);
        if (qna != null) params['qna'] = String(qna);
        if (rfc) params['rfc'] = rfc;
        if (curp) params['curp'] = curp;
      return this.http.get<ApiResponse<any[]>>(`${this.base}/nomina/cheque`, { params });
    }

}
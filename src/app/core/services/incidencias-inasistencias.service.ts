import { inject, Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { HttpClient } from "@angular/common/http";
import { ApiResponse } from "../model/response/api-Response.model";
import { Observable } from "rxjs";
import { IncidenciasInasistenciasRequest } from "../model/request/iniasistencias-request.model";
import { IncidenciaResponse } from "../model/response/incidencias-inasistencias/incidencias-response.model";

@Injectable({ providedIn: 'root' })
export class IncidenciasInasistenciasService {

    private base = environment.apiUrl;
    private readonly http = inject (HttpClient);

    addIncidencia(payload: IncidenciasInasistenciasRequest): Observable<ApiResponse<IncidenciaResponse>> {
        return this.http.post<ApiResponse<IncidenciaResponse>>(`${this.base}/inasistencias`, payload);
    }

    addIncidenciasLote(payloads: IncidenciasInasistenciasRequest[]): Observable<ApiResponse<IncidenciaResponse[]>> {
        return this.http.post<ApiResponse<IncidenciaResponse[]>>(`${this.base}/inasistencias/lote`, payloads);
    }

    deleteIncidencia(id: number): Observable<ApiResponse<unknown>> {
        return this.http.delete<ApiResponse<unknown>>(`${this.base}/inasistencias/${id}`);
    }
}
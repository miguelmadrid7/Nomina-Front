import { inject, Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { HttpClient, HttpParams } from "@angular/common/http";
import { ApiResponse } from "../model/response/api-Response.model";
import { Observable } from "rxjs";
import { IncidenciasInasistenciasRequest } from "../model/request/iniasistencias-request.model";
import { IncidenciaResponse } from "../model/response/incidencias-inasistencias/incidencias-response.model";
import { InasistenciasResponse } from "../model/response/incidencias-inasistencias/inasistencias-response.model";
import { EmpleadoWithPlaza } from "../model/empleado-with-plaza.model";
import { InasistenciaLoteRequest } from "../model/request/inasistencia-lote-request.model";
import { InasistenciaLoteResponse } from "../model/response/incidencias-inasistencias/inasistencia-lote-response.model";

@Injectable({ providedIn: 'root' })
export class IncidenciasInasistenciasService {

    private base = environment.apiUrl;
    private readonly http = inject (HttpClient);

    getAllEmployees(params: { search?: string}): Observable<ApiResponse<EmpleadoWithPlaza[]>> {
        const search = params.search;
        let httpParams = new HttpParams();
        if(search != null) {
            httpParams = httpParams.set('search', String(search));
        }
        return this.http.get<ApiResponse<EmpleadoWithPlaza[]>>(`${this.base}/inasistencias/trabajadores`, { params: httpParams });
    }

    getIncidencias(params: { empleadoId?: number, qnaProceso?: number, desde?: string, hasta?: string, tipo?: string } = {}): Observable<ApiResponse<InasistenciasResponse[]>> {
        let httpParams = new HttpParams();
        if (params.empleadoId != null) {
            httpParams = httpParams.set('empleadoId', String(params.empleadoId));
        }
        if (params.qnaProceso != null) {
            httpParams = httpParams.set('qnaProceso', String(params.qnaProceso));
        }
        if (params.desde) {
            httpParams = httpParams.set('desde', params.desde);
        }
        if (params.hasta) {
            httpParams = httpParams.set('hasta', params.hasta);
        }
        if (params.tipo) {
            httpParams = httpParams.set('tipo', params.tipo);
        }
        return this.http.get<ApiResponse<InasistenciasResponse[]>>(`${this.base}/inasistencias`, { params: httpParams });
    }

    addIncidencia(payload: IncidenciasInasistenciasRequest): Observable<ApiResponse<IncidenciaResponse>> {
        return this.http.post<ApiResponse<IncidenciaResponse>>(`${this.base}/inasistencias`, payload);
    }

    addIncidenciasLote(payload: InasistenciaLoteRequest): Observable<ApiResponse<InasistenciaLoteResponse>> {
        return this.http.post<ApiResponse<InasistenciaLoteResponse>>(`${this.base}/inasistencias/lote`, payload);
    }

    deleteIncidencia(id: number): Observable<ApiResponse<unknown>> {
        return this.http.delete<ApiResponse<unknown>>(`${this.base}/inasistencias/${id}`);
    }
}
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../models/response/api-Response.model';
import { ParametrizacionRequest } from '../../models/request/parametrizacion-request.model';
import { ParametrizacionResponse } from '../../models/response/parametrizacion-response.model';

@Injectable({ providedIn: 'root' })
export class ParametrizacionService {
    private base = environment.apiUrl;
    private readonly http = inject(HttpClient);

    getAllParam(): Observable<ApiResponse<ParametrizacionResponse[]>> {
        return this.http.get<ApiResponse<ParametrizacionResponse[]>>(`${this.base}/salario-minimo`);
    }

    createParam(payload: ParametrizacionRequest): Observable<ApiResponse<ParametrizacionResponse>> {
        return this.http.post<ApiResponse<ParametrizacionResponse>>(`${this.base}/salario-minimo`, payload);
    }

    updateParam(paramId: number, payload: ParametrizacionRequest): Observable<ApiResponse<ParametrizacionResponse>> {
        return this.http.patch<ApiResponse<ParametrizacionResponse>>(`${this.base}/salario-minimo/${paramId}`, payload);
    }

    softDeleteParam(paramId: number): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.base}/salario-minimo/${paramId}`);
    }
}
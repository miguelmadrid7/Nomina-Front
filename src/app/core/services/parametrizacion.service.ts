import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../models/response/api-Response.model';
import { ParametrizacionRequest } from '../../models/request/parametrizacion-request.model';

@Injectable({ providedIn: 'root' })
export class ParametrizacionService {
  private base = environment.apiUrl;
  constructor(private http: HttpClient) {}

    getAllParam(): Observable<any> {
        return this.http.get<ApiResponse<any>>(`${this.base}/salario-minimo`);
    }

    createParam(payload: ParametrizacionRequest): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(`${this.base}/salario-minimo`, payload);
    } 

    updateParam(paramId: number, payload: ParametrizacionRequest): Observable<ApiResponse<any>> {
        return this.http.patch<ApiResponse<any>>(`${this.base}/salario-minimo/${paramId}`, payload);
    }

    softDeleteParam(paramId: number): Observable<ApiResponse<any>> {
        return this.http.delete<ApiResponse<any>>(`${this.base}/salario-minimo/${paramId}`);
    }



}
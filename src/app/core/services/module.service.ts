import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../models/response/api-Response.model';
import { Module } from '../../models/gestion-core/module.model';
import { ModuleRequest } from '../../models/request/module-request.model';

@Injectable({ providedIn: 'root' })
export class ModuleService {
  private base = environment.apiUrl;
  constructor(private http: HttpClient) {}

    getAllModules(): Observable<Module[]> {
        return this.http.get<ApiResponse<Module[]>>(`${this.base}/modules`).pipe(map(res => res.data ?? []));
    }

    getModule(moduleId: number): Observable<Module> {
        const headers = { moduleId: String(moduleId) };
        return this.http.get<ApiResponse<Module>>(`${this.base}/modules/module`, { headers }).pipe(map(res => res.data));
    }

    createModule(payload: ModuleRequest): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(`${this.base}/modules`, payload);
    }

    updateModule(moduleId: number, payload: ModuleRequest): Observable<ApiResponse<any>> {
        const headers = { moduleId: String(moduleId) };
        return this.http.patch<ApiResponse<any>>(`${this.base}/modules`, payload, { headers });
    }

    softDeleteModule(moduleId: number): Observable<ApiResponse<any>> {
        const headers = { moduleId: String(moduleId) };
        return this.http.patch<ApiResponse<any>>(`${this.base}/modules/softdeleted`, null, { headers });
    }
}
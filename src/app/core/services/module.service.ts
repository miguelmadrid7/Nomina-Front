import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../models/api-Response.model';
import { ModuleItem, ModuleRequest } from '../../models/gestion-core/module.model';

@Injectable({ providedIn: 'root' })
export class ModuleService {
  private base = environment.apiUrl;
  constructor(private http: HttpClient) {}

    getAllModules(): Observable<ModuleItem[]> {
        return this.http.get<ApiResponse<ModuleItem[]>>(`${this.base}/modules`).pipe(map(res => res.data ?? []));
    }

    getModule(moduleId: number): Observable<ModuleItem> {
        const headers = { moduleId: String(moduleId) };
        return this.http.get<ApiResponse<ModuleItem>>(`${this.base}/modules/module`, { headers }).pipe(map(res => res.data));
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
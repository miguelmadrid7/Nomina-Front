import { Injectable  } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '../../core/model/response/api-Response.model';
import { SidebarModule } from '../model/sidebar.model';

@Injectable({ providedIn: 'root' })
export class SidebarService {
    private base = environment.apiUrl;
    constructor(private http: HttpClient) {}

    getModulesByUser(): Observable<SidebarModule[]> {
        return this.http.get<ApiResponse<any[]>>(`${this.base}/users/moduleByUser`).pipe(
            map(res => (res.data ?? []).map(item => ({
                moduleId: item.moduleId ?? item.moduleid,
                moduleName: item.moduleName ?? item.modulename,
                description: item.description ?? null,
                config: item.config ?? null,
                path: item.path ?? item.config ?? null,
                parentId: item.parentId ?? item.parentid ?? null,
                parentName: item.parentName ?? item.parentname ?? null,
                icon: item.icon ?? null,
                vista: item.vista ?? false,
            })))
        );
    }

}
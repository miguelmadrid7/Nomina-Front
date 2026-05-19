import { Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { ApiResponse } from "../../models/api-Response.model";
import { CreateRoleRequest, Role } from "../../models/emplado.model";
import { Observable, map } from "rxjs";
import { HttpClient } from "@angular/common/http";

@Injectable({ providedIn: 'root' })
export class RolService {
  private base = environment.apiUrl;
  constructor(private http: HttpClient) {}

    getRoles(): Observable<Role[]> {
        return this.http.get<ApiResponse<Role[]>>(`${this.base}/roles`).pipe(map(res => res.data ?? []));
    }

    getRole(roleId: number): Observable<Role> {
        return this.http.get<ApiResponse<Role>>(`${this.base}/roles/role`, { headers: { roleId: roleId.toString() } }).pipe(map(res => res.data));
    }

    createRole(payload: CreateRoleRequest): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(`${this.base}/roles`, payload);
    }

    updateRole(roleId: number, payload: CreateRoleRequest): Observable<ApiResponse<any>> {
        return this.http.patch<ApiResponse<any>>(`${this.base}/roles`, payload,{ headers: {roleId: roleId.toString()}});
    }

    softDeleteRole(roleId: number): Observable<ApiResponse<any>> {
        return this.http.patch<ApiResponse<any>>(`${this.base}/roles/softdeleted`,null,{ headers: { roleId: roleId.toString() } });
    }
}
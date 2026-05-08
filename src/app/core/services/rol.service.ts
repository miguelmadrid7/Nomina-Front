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

    createRole(payload: CreateRoleRequest): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(`${this.base}/roles`, payload);
    }



}
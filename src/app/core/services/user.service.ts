import { Injectable  } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '../../models/response/api-Response.model';
import { EmpleadoItem } from '../../models/emplado.model';
import { Role } from '../../models/rol.model';

@Injectable({ providedIn: 'root' })
export class UserService {

    private base = environment.apiUrl;
    constructor(private http: HttpClient) {}

    getAllUsers(): Observable<EmpleadoItem[]> {
        return this.http.get<ApiResponse<EmpleadoItem[]>>(`${this.base}/users`).pipe(map(res => res.data ?? []));
    }

    getRoles(): Observable<Role[]> {
      return this.http.get<ApiResponse<Role[]>>(`${this.base}/roles`).pipe(map(res => res.data ?? []));
    }

    createUser(payload: {
      srl_emp: number;
      password: string;
      user: string;
      area?: string | null;
      task?: string | null;
      roles: number[];
      extras?: number[];
      principal?: string | null;
      organizationId?: number | null;
      active?: boolean | null;
      notifications?: number[];
    }): Observable<any> {
      return this.http.post<ApiResponse<any>>(`${this.base}/users`, payload);
    }

    softDeleteUser(userId: number): Observable<any> {
      const headers = new HttpHeaders({ userId: String(userId) });
      return this.http.patch<ApiResponse<any>>(`${this.base}/users/softdeleted`, null, { headers });
    }

    updateUser(userId: number, payload: any): Observable<any> {
      const headers = new HttpHeaders({ userId: String(userId) });
      return this.http.patch<ApiResponse<any>>(`${this.base}/users`, payload, { headers });
    }

    assignRoles(userId: number, roleIds: number[]): Observable<any> {
      const headers = new HttpHeaders({ userId: String(userId) });
      return this.http.post<ApiResponse<any>>(`${this.base}/roles/roleByUser`, roleIds, { headers });
    }
}

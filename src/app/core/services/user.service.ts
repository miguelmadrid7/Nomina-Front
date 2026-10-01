import { Injectable  } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '../../core/model/response/api-Response.model';
import { EmpleadoItem } from '../model/emplado.model';
import { Role } from '../model/rol.model';
import { User } from '../model/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {

  private base = environment.apiUrl;
  constructor(private http: HttpClient) {}

  //Obtiene lo usuarios del sistema
  getAllUsers(): Observable<User[]> {
    return this.http.get<ApiResponse<User[]>>(`${this.base}/users`).pipe(map(res => res.data ?? []));
  }

  //Obtiene todo los roles
  getRoles(): Observable<Role[]> {
    return this.http.get<ApiResponse<Role[]>>(`${this.base}/roles`).pipe(map(res => res.data ?? []));
  }

  getUser(userId: number): Observable<User> {
    const headers = new HttpHeaders({ 
      userId: String(userId) 
    });
    return this.http.get<ApiResponse<User>>(`${this.base}/users/user`, { headers }).pipe(map(res => res.data));
  }

  //Roles por usuarios
  getRolesByUser(userId: number): Observable<number[]> {
    const headers = new HttpHeaders({ userId: String(userId) });
    return this.http.get<ApiResponse<number[]>>(`${this.base}/users/rolesByUser`, { headers }).pipe(map(res => res.data ?? []));
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

  assignRoles(userId: number, roleIds: number[]): Observable<any> {
    const headers = new HttpHeaders({ userId: String(userId) });
    return this.http.post<ApiResponse<any>>(`${this.base}/roles/roleByUser`, roleIds, { headers });
  }

  softDeleteUser(userId: number): Observable<any> {
    const headers = new HttpHeaders({ userId: String(userId) });
    return this.http.patch<ApiResponse<any>>(`${this.base}/users/softdeleted`, null, { headers });
  }

  updateUser(userId: number, payload: any): Observable<any> {
    const headers = new HttpHeaders({ userId: String(userId) });
    return this.http.patch<ApiResponse<any>>(`${this.base}/users`, payload, { headers });
  }
}

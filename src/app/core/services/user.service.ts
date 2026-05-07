import { Injectable  } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '../../models/api-Response.model';
import { EmpleadoItem, Role } from '../../models/emplado.model';

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
}

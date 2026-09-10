import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { LoginService } from './login.service';

@Injectable({ providedIn: 'root' })
export class ConceptoAccesoService {

  constructor(private http: HttpClient, private loginService: LoginService ) {}

  getConceptosPermitidos(): Observable<string[]> {
    const roles = this.loginService.getRoles();
    const roleId = roles?.[0];
    if (!roleId) return of([]);

    return this.http.get<any>(`${environment.apiUrl}/roles/conceptos`, { headers: { roleId: String(roleId)}}).pipe(
      map(res => {
        return res?.data ?? [];
      }),
      catchError((err) => {
        console.error('❌ Error al obtener conceptos:', err);
        return of([]);
      })
    );
  }
}
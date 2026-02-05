import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { CalculationNomina } from '../interfaces/nomina-ordinaria-inter';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class NominaService {
  private base = environment.apiUrl;
  
  constructor(private http: HttpClient, @Inject(PLATFORM_ID) private platformId: Object) {}

  getCalculation(params: {
  qnaProceso: number;
  nivelSueldo?: number;
  concepto?: string[];
  empleadoId?: number;
  tipoConcepto?: string;
  page?: number;
  size?: number;
}): Observable<any> {
  const token = isPlatformBrowser(this.platformId) ? localStorage.getItem('token') : null;
  
  // EL BACKEND ESPERA @RequestHeader, no params
  let headers = new HttpHeaders()
    .set('qnaProceso', params.qnaProceso.toString());

  if(token) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }

  // Agrega los demás headers si existen
  if(params.nivelSueldo) {
    headers = headers.set('nivelSueldo', params.nivelSueldo.toString());
  }

  if(params.concepto) {
    params.concepto.forEach(c => {
      headers = headers.append('concepto', c)
    });
  }

  if(params.empleadoId) {
    headers = headers.set('empleadoId', params.empleadoId.toString());
  }

  if(params.tipoConcepto) {
    headers = headers.set('tipoConcepto', params.tipoConcepto.toString());
  }

  // EL BACKEND NO USA PAGINACIÓN - elimina params
  return this.http.get(`${this.base}/calculation`, { headers });
}
}
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
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

  downloadExcel(body: {
    qnaProceso: number;
    nivelSueldo?: number;
    conceptos?: string[];
    empleadoId?: number;
    tipoConcepto?: string;
  }) {
    const token = isPlatformBrowser(this.platformId) ? localStorage.getItem('token') : null;

  
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    if (token) headers = headers.set('Authorization', `Bearer ${token}`);

    console.log('token usado para excel', token);
    return this.http.post(`${this.base}/calculation/excel`, body, {
      headers,
      responseType: 'blob'
    });
  }

  executePayrollProcess(qnaProceso: number): Observable<any> {
    return this.http.post(`${this.base}/calculation/execute`, { qnaProceso });
  }

getJobStatus(id: number): Observable<any> {
  return this.http.get(`${this.base}/calculation/status/${id}`);
}



}

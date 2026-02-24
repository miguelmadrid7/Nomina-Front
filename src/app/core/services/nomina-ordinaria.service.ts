import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { CalculationNomina } from '../../models/nomina-ordinaria-inter';

@Injectable({ providedIn: 'root' })
export class NominaService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient, @Inject(PLATFORM_ID) private platformId: Object) {}



  getNominaCheque(): Observable<any> {
  const token = isPlatformBrowser(this.platformId)
    ? localStorage.getItem('token')
    : null;

  let headers = new HttpHeaders();

  if (token) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }

  return this.http.get(`${this.base}/calculation/nomina-cheque`, { headers });
  }

  executePayrollProcess(qnaProceso: number): Observable<any> {
    return this.http.post(`${this.base}/calculation/execute`, { qnaProceso });
  }

  getJobStatus(id: number): Observable<any> {
    return this.http.get(`${this.base}/calculation/status/${id}`);
  }

  downloadCalculoCsv(request: CalculationNomina) {
  const token = isPlatformBrowser(this.platformId) ? localStorage.getItem('token') : null;
  let headers = new HttpHeaders().set('Accept', 'text/csv');
  if (token) headers = headers.set('Authorization', `Bearer ${token}`);

  return this.http.post(
    `${this.base}/calculation/excel/csv`,
    request,
    { headers, responseType: 'blob', observe: 'response' }
  );
}

exportarAnexoV(): Observable<Blob> {
  const token = isPlatformBrowser(this.platformId) ? localStorage.getItem('token') : null;
  let headers = new HttpHeaders().set('Accept', 'text/csv');
  if (token) headers = headers.set('Authorization', `Bearer ${token}`);
  return this.http.post(`${this.base}/calculation/export-anexo-v`, null, {
    headers,
    responseType: 'blob'
  });
}


  exportarAnexoVI(): Observable<Blob> {
  const token = isPlatformBrowser(this.platformId) ? localStorage.getItem('token') : null;
  let headers = new HttpHeaders().set('Accept', 'text/csv');
  if (token) headers = headers.set('Authorization', `Bearer ${token}`);
  return this.http.post(`${this.base}/calculation/export-anexo-VI`, null, {
    headers,
    responseType: 'blob'
  });
}




}

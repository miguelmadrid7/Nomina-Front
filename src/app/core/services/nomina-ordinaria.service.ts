import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { CalculationNomina } from '../../models/nomina-Ordinaria.model';
import { ApiResponse } from '../../models/api-Response.model';

@Injectable({ providedIn: 'root' })
export class NominaService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}



  getNominaCheque(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.base}/calculation/nomina-cheque`);
  }

  executePayrollProcess(qnaProceso: number): Observable<ApiResponse<number>> {
    return this.http.post<ApiResponse<number>>(`${this.base}/calculation/execute`, { qnaProceso });
  }

  getJobStatus(id: number): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.base}/calculation/status/${id}`);
  }

  downloadCalculoCsv(request: CalculationNomina) {
    return this.http.post(
      `${this.base}/calculation/excel/csv`,
      request,
      {
        responseType: 'blob',
        observe: 'response'
      }
    );
  }

  exportarAnexoV() {
    return this.http.post(
      `${this.base}/calculation/export-anexo-v`,
      null,
      { responseType: 'blob' }
    );
  }

  exportarAnexoVI() {
    return this.http.post(
      `${this.base}/calculation/export-anexo-VI`,
      null,
      { responseType: 'blob' }
    );
  }
}
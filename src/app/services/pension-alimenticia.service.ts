import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { ApiResponse } from '../interfaces/api-response-inter';
import { Banco, BeneficiarioAlimRequest, BeneficiarioRequest, IdResponse } from '../interfaces/pension-alimenticia-inter';
import { Empleado } from '../components/servicios/empleado';


@Injectable({ providedIn: 'root' })
export class PensionAlimenticiaService {
  private base = environment.apiUrl;
  private isBrowser: boolean;

  constructor(
        private http: HttpClient, 
        @Inject(PLATFORM_ID) platformId: Object
    ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

    private buildHeaders(
        extraHeaderKey?: string,
        extraHeaderValue?: string
    ): HttpHeaders {
        let headers = new HttpHeaders();
        if (this.isBrowser) {
            const token = localStorage.getItem('token');
            if (token) {
            headers = headers.set('Authorization', `Bearer ${token}`);
            }
        }
        if (extraHeaderKey && extraHeaderValue) {
            headers = headers.set(extraHeaderKey, extraHeaderValue);
        }
        return headers;
    }

    // Busca por RFC/CURP/NOMBRE usando header targetValue
    searchPorTarget(target: 'RFC' | 'CURP' | 'NOMBRE', value: string): Observable<ApiResponse<Empleado>> {
        return this.http.get<ApiResponse<Empleado>>(
            `${this.base}/employee/by/${target}`, 
            { headers: this.buildHeaders('targetValue', value) }
        );
    }

    // Búsqueda libre (una sola caja)
    searchEmpleadoLibre(search: string): Observable<ApiResponse<Empleado>> {  
        return this.http.get<ApiResponse<Empleado>>(
            `${this.base}/employee/by/${encodeURIComponent(search)}/search`, 
            { headers: this.buildHeaders() }
        );
    }

    //Se obtiene la lista de los banco que hay en la bd y los muestra el combobox
    getBancos(): Observable<ApiResponse<Banco[]>> {
        return this.http.get<ApiResponse<Banco[]>>(
            `${this.base}/catalogo/bancos`, 
            { headers: this.buildHeaders() }
        );
    }

    addBeneficiarioAlim(payload: BeneficiarioAlimRequest): Observable<ApiResponse<IdResponse>> {
        return this.http.post<ApiResponse<IdResponse>>(`${this.base}/beneficiarios/alim`, payload, 
            { headers: this.buildHeaders() }
        );
    }

    addBeneficario(payload: BeneficiarioRequest): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(`${this.base}/beneficiarios`, payload, 
            { headers: this.buildHeaders() }
        );
    }

}

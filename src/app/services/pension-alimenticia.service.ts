import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';


@Injectable({ providedIn: 'root' })
export class PensionAlimenticiaService {
  private base = environment.apiUrl;
  private isBrowser: boolean;

  constructor(private http: HttpClient, @Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

    // Busca por RFC/CURP/NOMBRE usando header targetValue
    searchPorTarget(target: 'RFC' | 'CURP' | 'NOMBRE', value: string) {
        let headers = new HttpHeaders();
        if (this.isBrowser) {
            const token = localStorage.getItem('token');
            if (token) headers = headers.set('Authorization', `Bearer ${token}`);
        }
        headers = headers.set('targetValue', value);
    return this.http.get(`${this.base}/employee/by/${target}`, { headers });
    }

    // Búsqueda libre (una sola caja)
    searchEmpleadoLibre(search: string) {
        let headers = new HttpHeaders();
        if (this.isBrowser) {
            const token = localStorage.getItem('token');
            if (token) headers = headers.set('Authorization', `Bearer ${token}`);
        }
    return this.http.get(`${this.base}/employee/by/${encodeURIComponent(search)}/search`, { headers });
    }

  //Se obtiene la lista de los banco que hay en la bd y los muestra el combobox
  getBancos(): Observable<any> {
    let headers = new HttpHeaders();
    if(this.isBrowser) {
        const token = localStorage.getItem('token');
        if(token) {
            headers = headers.set('Authorization', `Bearer ${token}`)
        }
    }
    return this.http.get(`${this.base}/catalogo/bancos`, { headers });
  }

  addBeneficiarioAlim(payload: any): Observable<any> {
    let headers = new HttpHeaders();
    if(this.isBrowser) {
        const token = localStorage.getItem('token');
        if(token) {
            headers = headers.set('Authorization', `Bearer ${token}`)
        }
    }
    return this.http.post(`${this.base}/beneficiarios/alim`, payload, { headers });
  }

  addBeneficario(payload: any): Observable<any>{
    let headers = new HttpHeaders();
    if(this.isBrowser) {
        const token = localStorage.getItem('token');
        if(token) {
            headers = headers.set('Authorization', `Bearer ${token}`)
            }
        }
        
        return this.http.post(`${this.base}/beneficiarios`, payload, { headers });
  }

}

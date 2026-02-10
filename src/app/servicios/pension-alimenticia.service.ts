import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { H } from '@angular/cdk/keycodes';


@Injectable({ providedIn: 'root' })
export class PensionAlimenticiaService {
  private base = environment.apiUrl;
  private isBrowser: boolean;

  constructor(private http: HttpClient, @Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

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


}

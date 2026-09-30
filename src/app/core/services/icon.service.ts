import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../core/model/response/api-Response.model';
import { IconRequest } from '../../core/model/request/icon-requets.model';
import { Icon } from '../model/gestion-core/icon.model';

@Injectable({ providedIn: 'root' })
export class IconService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getIcons(): Observable<Icon[]> {
    return this.http.get<ApiResponse<Icon[]>>(`${this.base}/notifications/icons`).pipe(map((res) => res?.data ?? []));
  }


  createIcon(payload: IconRequest): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.base}/notifications/icons`,payload);
  }
}
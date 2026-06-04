import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../models/api-Response.model';
import { IconRequest } from '../../models/request/icon-requets.model';

@Injectable({ providedIn: 'root' })
export class IconService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  createIcon(payload: IconRequest): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.base}/notifications/icons`,payload);
  }
}
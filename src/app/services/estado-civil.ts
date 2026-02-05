import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

import { EstadoCivil } from '../interfaces/estado-civil';


@Injectable({
  providedIn: 'root'
})
export class EstadoCivilService {
  
  private apiUrl = 'https://reqres.in/api/users?page=2';


  constructor(private http: HttpClient) { }


  public getEstadoCivil(): Observable<EstadoCivil> {
    return this.http.get<EstadoCivil>(this.apiUrl);
  }


}

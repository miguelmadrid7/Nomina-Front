import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class JuiciosMercantiles {

    constructor(private http: HttpClient) {}

    private base = environment.apiUrl;

    

}

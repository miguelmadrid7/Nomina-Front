import { Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable } from "rxjs";
import { LogFileResponse } from "../model/response/logfile-response.model";
import { LogDateResponse } from "../model/response/logdate-response.model";

@Injectable({
  providedIn: 'root'
})
export class LogService {
    private base = environment.apiUrl;
     constructor(private http: HttpClient) {}

    private getHeaders(): HttpHeaders {
        const token = localStorage.getItem('token');
        return new HttpHeaders().set('Authorization', `Bearer ${token}`); // Agregar espacio
    } 

    searchLog(fecha: string, tipo: string, searchText: string): Observable<LogFileResponse> {
        return this.http.get<LogFileResponse>(`${this.base}/logs/${fecha}/${tipo}/search`, { headers: this.getHeaders(), params: { searchText } }); // Agregar /logs
    }

    getAvailableDates(): Observable<LogDateResponse> {
        return this.http.get<LogDateResponse>(`${this.base}/logs/fechas`, {headers: this.getHeaders()}); // Agregar /logs
    }

    getApplicationLog(fecha: string): Observable<LogFileResponse> {
        return this.http.get<LogFileResponse>(`${this.base}/logs/${fecha}/application`, { headers: this.getHeaders()}); // Agregar /logs
    }

    getErrorLog(fecha: string): Observable<LogFileResponse> {
        return this.http.get<LogFileResponse>(`${this.base}/logs/${fecha}/error`, { headers: this.getHeaders()}); // Agregar /logs
    }

    getLoginLog(fecha: string): Observable<LogFileResponse> {
        return this.http.get<LogFileResponse>(`${this.base}/logs/${fecha}/login`, { headers: this.getHeaders() }); // Agregar /logs
    }

    tailLog(fecha: string, tipo: string, lines: number = 100): Observable<LogFileResponse> {
        return this.http.get<LogFileResponse>(`${this.base}/logs/${fecha}/${tipo}/tail`, { headers: this.getHeaders(), params: { lines: lines.toString() } }); // Agregar /logs
    }
}
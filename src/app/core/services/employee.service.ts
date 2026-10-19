import { HttpClient, HttpHeaders } from "@angular/common/http";
import { environment } from "../../../environments/environment";
import { Injectable } from "@angular/core";
import { map, Observable } from "rxjs";
import { Empleado } from "../../features/servicios/empleado";
import { ApiResponse } from "../model/response/api-Response.model";

@Injectable({ providedIn: 'root' })
export class EmployeeService {

    private base = environment.apiUrl;
    constructor(private http: HttpClient) {}

     //Search free by employee by RFC/CURP/NOMBRE
    searchEmployee(search: string): Observable<ApiResponse<Empleado[]>> {
        const q = encodeURIComponent(search.trim());
        return this.http.get<ApiResponse<Empleado[]>>(`${this.base}/employee/by/${q}/search`);
    }

    //Search that employee by target specific (RFC, CURP, NOMBRE)
    searchEmployeeByTarget(target: 'RFC' | 'CURP' | 'NOMBRE', value: string): Observable<ApiResponse<Empleado[]>> {
        const headers = new HttpHeaders({ targetValue: value });
        return this.http.get<ApiResponse<Empleado[]>>(`${this.base}/employee/by/${target}`, { headers });
    }

}
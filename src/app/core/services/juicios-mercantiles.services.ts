import { Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { HttpClient } from "@angular/common/http";
import { ApiResponse } from "../../models/api-Response.model";
import { Observable } from "rxjs";
import { BeneficiarioJMRequest } from "../../models/beneficiario-jm-request.model";

@Injectable({ providedIn: 'root' })
export class JuiciosMercantilesService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}



  getBuscarEmpleado(): Observable<BeneficiarioJMRequest[]> {
    return this.http.get<BeneficiarioJMRequest[]>(`${this.base}/beneficiarios/tab`);
  }

  agregarBeneficiario(payload: BeneficiarioJMRequest): Observable<number> {
    return this.http.post<number>(`${this.base}/beneficiarios/tab`, payload);
  }




}
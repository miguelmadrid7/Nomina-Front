import { Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { BeneficiarioJMRequest } from "../../models/beneficiario-jm-request.model";
import { ApiResponse } from "../../models/api-Response.model";
import { Banco } from "../../models/banco.model";

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


  //Se obtiene la lista de los banco que hay en la bd y los muestra el combobox
  getBancos() {
    return this.http.get<ApiResponse<Banco[]>>(`${this.base}/catalogo/bancos`);
  }



}
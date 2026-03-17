import { Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { HttpClient } from "@angular/common/http";
import { BeneficiarioJMRequest } from "../../models/beneficiario-jm-request.model";
import { ApiResponse } from "../../models/api-Response.model";
import { Banco } from "../../models/banco.model";
import { BeneficiarioNom } from "../../models/beneficiario-nom.model";

@Injectable({ providedIn: 'root' })
export class JuiciosMercantilesService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getBuscarEmpleado() {
    return this.http.get<ApiResponse<BeneficiarioJMRequest[]>>(`${this.base}/beneficiarios/tab`);
  }

  getobtenerBeneficiarios(empleadoId: number) {
    return this.http.get<ApiResponse<BeneficiarioNom[]>>(`${this.base}/beneficiarios/nom/${empleadoId}`);
  }

  agregarBeneficiario(data: any) {
    return this.http.post<number>(`${this.base}/beneficiarios/nom`, data);
  }


  //Se obtiene la lista de los banco que hay en la bd y los muestra el combobox
  getBancos() {
    return this.http.get<ApiResponse<Banco[]>>(`${this.base}/catalogo/bancos`);
  }



}

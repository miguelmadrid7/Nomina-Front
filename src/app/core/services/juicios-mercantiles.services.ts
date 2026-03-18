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

  //Buscador para search del empleado
  getBuscarEmpleado() {
    return this.http.get<ApiResponse<BeneficiarioJMRequest[]>>(`${this.base}/beneficiarios/tab`);
  }

   //Se obtiene la lista de los banco que hay en la bd y los muestra el combobox
  getBancos() {
    return this.http.get<ApiResponse<Banco[]>>(`${this.base}/catalogo/bancos`);
  }

  //Se obtiene los beneficiarios del empleado seleccionado
  getobtenerBeneficiarios(empleadoId: number) {
    return this.http.get<ApiResponse<BeneficiarioNom[]>>(`${this.base}/beneficiarios/nom/${empleadoId}`);
  }

  //Se hace post en el modal de dar de alta un beneficiario
  agregarBeneficiario(data: any) {
    return this.http.post<number>(`${this.base}/beneficiarios/nom`, data);
  }

  //Se actualiza los datos de un beneficiario seleccionado
  actualizarBeneficiario(id: number, data: any) {
    return this.http.put<number>(`${this.base}/beneficiarios/nom/${id}`, data);
  }


}

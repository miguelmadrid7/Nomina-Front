import { Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { HttpClient } from "@angular/common/http";
import { BeneficiarioJMRequest } from "../../models/beneficiario-jm-request.model";
import { ApiResponse } from "../../models/api-Response.model";
import { Banco } from "../../models/banco.model";
import { BeneficiarioNom } from "../../models/beneficiario-nom.model";
import { map } from "rxjs";

type AnyRow = Record<string, any>;

@Injectable({ providedIn: 'root' })
export class JuiciosMercantilesService {
  private base = environment.apiUrl;
 

  constructor(private http: HttpClient) {}


getBuscarEmpleado(search: string) {
  const q = (search ?? '').trim();
  return this.http
    .get<ApiResponse<AnyRow[]>>(`${this.base}/employee/by/${encodeURIComponent(q)}/search`)
    .pipe(
      map((resp) => {
        const raw: AnyRow[] = (resp as any)?.data ?? (resp as any) ?? [];
        const toNumber = (v: any) => Number.isFinite(Number(v)) ? Number(v) : null;

        const data: BeneficiarioJMRequest[] = raw.map((e: AnyRow) => ({
          id: toNumber(
            e?.['id'] ??
            e?.['empleadoId'] ??
            e?.['tabEmpleadosId'] ??
            e?.['tab_empleados_id']
          ) ?? undefined,

          rfc:
            e?.['rfc'] ??
            e?.['RFC'] ??
            e?.['rfc_empleado'] ??
            e?.['rfcEmpleado'] ??
            '',

          primerApellido:
            e?.['primerApellido'] ??
            e?.['apellidoPaterno'] ??
            e?.['primer_apellido'] ??
            e?.['apePat'] ??
            e?.['ape_pat'] ??
            '',

          segundoApellido:
            e?.['segundoApellido'] ??
            e?.['apellidoMaterno'] ??
            e?.['segundo_apellido'] ??
            e?.['apeMat'] ??
            e?.['ape_mat'] ??
            '',

          nombre:
            e?.['nombre'] ??
            e?.['nombres'] ??
            e?.['nombreEmpleado'] ??
            e?.['nombre_empleado'] ??
            (typeof e?.['empleado'] === 'string' ? e?.['empleado'] : '')
        }));

        return { ...(resp as any), data };
      })
    );
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
  return this.http.post<ApiResponse<any>>(`${this.base}/beneficiarios/nom`, data, {
    headers: { 'Content-Type': 'application/json' }
  });
}

  //Se actualiza los datos de un beneficiario seleccionado
  actualizarBeneficiario(id: number, data: any) {
  return this.http.put<ApiResponse<any>>(`${this.base}/beneficiarios/nom/${id}`, data, {
    headers: { 'Content-Type': 'application/json' }
  });
}

}

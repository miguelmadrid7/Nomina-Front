import { Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { HttpClient } from "@angular/common/http";
import { BeneficiarioJMRequest } from "../../core/model/request/beneficiariojm-request.model";
import { ApiResponse } from "../../core/model/response/api-Response.model";
import { Banco } from "../model/banco.model";
import { map } from "rxjs";

type AnyRow = Record<string, any>;

@Injectable({ providedIn: 'root' })
export class JuiciosMercantilesService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  //Buscador para search del empleado
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

  // Catalogo de bancos
  getBancos() {
    return this.http.get<ApiResponse<Banco[]>>(`${this.base}/catalogo/bancos`);
  }
  //Lista de benficiarios
  getTodosBeneficiarios() {
    return this.http.get<ApiResponse<any[]>>(`${this.base}/beneficiarios/jm/tab`);
  }

  saveBeneficiary(formValue: any, employeeId: number) {
    const payload = {
      rfc: formValue.rfc,
      primerApellido: formValue.primerApellido,
      segundoApellido: formValue.segundoApellido,
      nombre: formValue.nombre,
      clabeInterbancaria: formValue.clabe,
      ctaBancaria: formValue.citaBancaria,
      catBancoId: formValue.bancoId
    };
    return this.http.post<ApiResponse<any>>(`${this.base}/beneficiarios/jm/tab`, payload);
  }

  //Se hace post en el modal de dar de alta un beneficiario
  agregarBeneficiario(data: any) {
    return this.http.post<ApiResponse<any>>(`${this.base}/beneficiarios/jm`, data, {headers: { 'Content-Type': 'application/json' }});
  }

  //Se actualiza los datos de un beneficiario seleccionado
  actualizarBeneficiario(id: number, data: any) {
    return this.http.patch<ApiResponse<any>>(`${this.base}/beneficiarios/jm/${id}`, data, { headers: { 'Content-Type': 'application/json' } });
  }

  //Beneficiarios NOM vigentes de un empleado
  getBeneficiariosPorEmpleado(empleadoId: number) {
    return this.http.get<ApiResponse<any>>(`${this.base}/beneficiarios/jm/empleado/${empleadoId}`);
  }

  //Histórico (vigentes + cancelados + finalizados) con estatus calculado; qnaActual es opcional
  getHistoricoPorEmpleado(empleadoId: number, qnaActual?: number) {
    const params: Record<string, string> = {};
    if (qnaActual != null) {
      params['qnaActual'] = qnaActual.toString();
    }
    return this.http.get<ApiResponse<any>>(`${this.base}/beneficiarios/jm/empleado/${empleadoId}/historico`, { params });
  }

  //Actualiza los datos bancarios (TAB) de un beneficiario
  actualizarTab(id: number, data: any) {
    return this.http.patch<ApiResponse<any>>(`${this.base}/beneficiarios/jm/tab/${id}`, data, { headers: { 'Content-Type': 'application/json' } });
  }
}

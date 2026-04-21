import { Injectable  } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { map, Observable } from 'rxjs';
import { ApiResponse } from '../../models/api-Response.model';
import { BeneficiarioJMRequest } from '../../models/beneficiario-jm-request.model';

type AnyRow = Record<string, any>;

@Injectable({ providedIn: 'root' })
export class TerceroService {
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

                empleado: e?.['empleado'] ?? '', 
    
                rfc:
                  e?.['rfc'] ??
                  e?.['RFC'] ??
                  e?.['rfc_empleado'] ??
                  e?.['rfcEmpleado'] ??
                  '',

                curp:   
                  e?.['curp'] ??
                  e?.['CURP'] ??
                  e?.['curp_empleado'] ??
                  e?.['curpEmpleado'] ??
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

    // Se obtienen los conceptos de la bd
    obtenerConceptos(): Observable<any> {
      return this.http.get<any>(`${this.base}/tercero/conceptos`);
    }

}
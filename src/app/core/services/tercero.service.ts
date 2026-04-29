import { Injectable  } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { map, Observable } from 'rxjs';
import { ApiResponse } from '../../models/api-Response.model';
import { Empleado } from '../../features/servicios/empleado';
import { RegistroNp } from '../../models/terceros.model';

@Injectable({ providedIn: 'root' })
export class TerceroService {

    private base = environment.apiUrl;
    constructor(private http: HttpClient) {}

    //Buscador para search del empleado
    searchEmployees(search: string): Observable<Empleado[]> {
      const q = encodeURIComponent(search.trim());
      return this.http.get<ApiResponse<Empleado[]>>(`${this.base}/employee/by/${q}/search`) .pipe(map(res => res.data ?? []));
    }

    // Se hace el resgistro de los terceros
    registrarNp(payload: RegistroNp) {
      return this.http.post<ApiResponse<Empleado[]>>(`${this.base}/nom-emp-pza-cpto/registro-np`,payload);
    }

    // Se obtienen los conceptos de la bd
    obtenerConceptos(): Observable<any[]> {
      return this.http.get<any>(`${this.base}/nom-emp-pza-cpto/conceptos`).pipe(
        map(res => res?.data ?? []),
        map((rows: any[]) => {
          const seen = new Set<string>();
          const out: any[] = [];

          for (const r of rows ?? []) {
            const cve = String(r?.cve ?? '').trim();
            if (!cve || seen.has(cve)) continue;
            seen.add(cve);
            out.push(r);
          }

          return out;
        })
      );
    }

    obtenerRegistrosNp(params: {
      qnaProceso?: number | null;
      concepto?: string | null;
      page?: number;
      size?: number;
    }): Observable<{ rows: any[]; total: number }> {
      const page = params.page ?? 0;
      const size = params.size ?? 50;

      let httpParams = new HttpParams()
        .set('page', String(page))
        .set('size', String(size));

      if (params.qnaProceso != null) httpParams = httpParams.set('qnaProceso', String(params.qnaProceso));
      if (params.concepto) httpParams = httpParams.set('concepto', params.concepto);

      return this.http
        .get<ApiResponse<any[]>>(`${this.base}/nom-emp-pza-cpto/registros-np`, { params: httpParams })
        .pipe(
          map(res => ({
            rows: res?.data ?? [],
            total: res?.count ?? 0,
          }))
        );
    }

  obtenerConteoPorConcepto(qnaProceso: number): Observable<Array<{ cve: string; total: number }>> {
    const params = new HttpParams().set('qnaProceso', String(qnaProceso));

    return this.http
      .get<ApiResponse<any>>(`${this.base}/nom-emp-pza-cpto/conteo-por-concepto`, { params })
      .pipe(
        map(res => res?.data ?? []),
        map((rows: any[]) =>
          rows.map(r => ({
            cve: String(r?.cve ?? '').trim(),
            total: Number(r?.total ?? 0),
          }))
        )
      );
  }


}

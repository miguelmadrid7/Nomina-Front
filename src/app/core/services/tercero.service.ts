import { Injectable  } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { map, Observable } from 'rxjs';
import { ApiResponse } from '../../core/model/response/api-Response.model';
import { Empleado } from '../../features/servicios/empleado';
import { RegistroNp } from '../../models/terceros.model';
import { CalendarioRecepcion } from '../../models/calendario-recepcion.model';

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

    // Se obtienen los los registro por medio del concepto
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

    // Se obtienen el numero total de los registros por qna y por concepto
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

    editarRegistroNp(id: number, payload: any) {
      return this.http.put<ApiResponse<any>>(`${this.base}/nom-emp-pza-cpto/registro-np/${id}`, payload);
    }

    // Se obtiene importe real mensual del concepto seleccionado
    getImporteMensualReal(rfc: string, concepto: string, qnaProceso?: number | null) {
      let params = new HttpParams().set('rfc', (rfc ?? '').trim()) .set('concepto', (concepto ?? '').trim());
      if (qnaProceso != null) params = params.set('qnaProceso', String(qnaProceso));
      return this.http.get<ApiResponse<any>>(`${this.base}/nom-emp-pza-cpto/importe-mensual-real`, { params }).pipe(map(res => res?.data ?? null));
    }

    descargarRegistrosNpExcel(qnaProceso?: number | null, concepto?: string | null): Observable<Blob> {
      let params = new HttpParams();
      if (qnaProceso != null) params = params.set('qnaProceso', String(qnaProceso));
      if (concepto) params = params.set('concepto', String(concepto).trim());

      return this.http.get(`${this.base}/nom-emp-pza-cpto/registros-np/excel`, {
        params,
        responseType: 'blob',
      });
    }

    descargarRegistrosNpPdf(qnaProceso?: number | null, concepto?: string | null): Observable<Blob> {
      let params = new HttpParams();
      if (qnaProceso != null) params = params.set('qnaProceso', String(qnaProceso));
      if (concepto) params = params.set('concepto', String(concepto).trim());
      return this.http.get(`${this.base}/nom-emp-pza-cpto/registros-np/pdf`, {params,responseType: 'blob',});
    }

    getCalendarioRecepcion(anio: number) {
      return this.http.get<ApiResponse<CalendarioRecepcion[]>>(`${this.base}/nom-emp-pza-cpto`, { params: { anio } })
        .pipe( map(res => res?.data ?? []));
    }

    getCalendarioRecepcionPorQna(qnaRecepcion: number) {
      return this.http .get<ApiResponse<CalendarioRecepcion>>(`${this.base}/nom-emp-pza-cpto/${qnaRecepcion}`)
        .pipe(map(res => res?.data ?? null));
    }

    uploadDocumento(file: File, rfc: string, numeroDocumento: string, qnaProceso: number): Observable<ApiResponse<any>> {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('rfc', rfc);
      formData.append('numeroDocumento', numeroDocumento);
      formData.append('qnaProceso', qnaProceso.toString());
      formData.append('usuarioId', '1');
      return this.http.post<ApiResponse<any>>(`${this.base}/nom-emp-pza-cpto/upload`, formData);
    }

    obtenerDocumentosPorEmpleado(tabEmpleadoId: number) {
      return this.http.get(`${this.base}/nom-emp-pza-cpto/documentos/${tabEmpleadoId}`);
    }

    descargarPdf(documentoId: number) {
      return this.http.get(`${this.base}/nom-emp-pza-cpto/download/${documentoId}`, {responseType: 'blob'});
    }
}

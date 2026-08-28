import { Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { ApiResponse } from "../model/response/api-Response.model";
import { CargarExcelResponse } from "../model/response/cargar-excel-response.model";
import { PersonalizarListResponse } from "../model/response/personalizar-list-response.model";
import { PersonalizarRegistroResponse } from "../model/response/personalizar-registro-response.model";
import { ContinuarResponse } from "../model/response/continuar-response.model";

@Injectable({
    providedIn: 'root',
})

export class PercepcionesInformadasService {
    private base = environment.apiUrl;

    constructor(private http: HttpClient) {}
    
    cargarExcel(
        file: File,
        qnaProceso: number,
        concepto: string,
        importeDefault?: number,
        usuarioId?: number,
    ): Observable<ApiResponse<CargarExcelResponse>> {
        const formData = new FormData();
        formData.append('file', file, file.name);
        formData.append('qnaProceso', qnaProceso.toString());
        formData.append('concepto', concepto);
        if (importeDefault !== undefined && importeDefault !== null) {
            formData.append('importeDefault', importeDefault.toString());
        }
        if (usuarioId !== undefined && usuarioId !== null) {
            formData.append('usuarioId', usuarioId.toString());
        }
        return this.http.post<ApiResponse<CargarExcelResponse>>(`${this.base}/nom-emp-pza-cpto/cargar-excel`, formData,);
    }

    listarPersonalizar(
        qnaProceso: number,
        concepto: string,
        estatus?: string,
        busqueda?: string,
        page: number = 0,
        size: number = 50,
    ): Observable<ApiResponse<PersonalizarListResponse>> {
        let params = new HttpParams()
            .set('qnaProceso', qnaProceso.toString())
            .set('concepto', concepto)
            .set('page', page.toString())
            .set('size', size.toString());
        if (estatus) {
            params = params.set('estatus', estatus);
        }
        if (busqueda) {
            params = params.set('busqueda', busqueda);
        }
        return this.http.get<ApiResponse<PersonalizarListResponse>>( `${this.base}/nom-emp-pza-cpto/personalizar`,{ params },);
    }

    personalizarRegistro(
        id: number,
        rfc: string,
        curp: string,
        nombreTrabajador: string,
        importe: number,
        cantidad: number,
    ): Observable<ApiResponse<PersonalizarRegistroResponse>> {
        const body = { rfc, curp, nombreTrabajador, importe, cantidad };
        return this.http.put<ApiResponse<PersonalizarRegistroResponse>>(`${this.base}/nom-emp-pza-cpto/personalizar/${id}`,body,);
    }

    continuar(qnaProceso: number, concepto: string): Observable<ApiResponse<ContinuarResponse>> {
        const body = { qnaProceso, concepto };
        return this.http.post<ApiResponse<ContinuarResponse>>(`${this.base}/nom-emp-pza-cpto/continuar`,body,);
    }

    descargarValidaciones(
        qnaProceso: number,
        concepto?: string,
        fechaCarga?: string,
    ): Observable<Blob> {
        let params = new HttpParams().set('qnaProceso', qnaProceso.toString());
        if (concepto) {
            params = params.set('concepto', concepto);
        }
        if (fechaCarga) {
            params = params.set('fechaCarga', fechaCarga);
        }
        return this.http.get(`${this.base}/nom-emp-pza-cpto/descargar-validaciones`, {params, responseType: 'blob',});
    }

}
import { Injectable} from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../core/model/response/api-Response.model';
import { BeneficiarioDTO } from '../model/dto/beneficiarioDTO.model';
import { BeneficiarioDetalleResponse } from '../../core/model/response/beneficiariodetalle-response.model';
import { BeneficiarioRequest } from '../../core/model/request/beneficiario-request.model';
import { IdResponse } from '../../core/model/response/id-response.model';
import { BeneficiarioAlimRequest } from '../../core/model/request/beneficiarioalim-request.model';
import { map, Observable } from 'rxjs';
import { LiquidoResponse } from '../../core/model/response/liquido-response.model';
import { BeneficiarioEmpleadoResponse } from '../../core/model/response/beneficiarioempleado-response.model';
import { CatalogoService } from './catalogo.service';
import { EmployeeService } from './employee.service';

@Injectable({ providedIn: 'root' })
export class PensionAlimenticiaService {

    private base = environment.apiUrl;
    constructor(
        private http: HttpClient, 
        private catalogoService: CatalogoService, 
        private employeeService: EmployeeService) {}

    private extraHeaders(key?: string, value?: string) {
        return key && value ? { headers: new HttpHeaders().set(key, value) } : {};
    }

    searchPorTarget(target: 'RFC' | 'CURP' | 'NOMBRE', value: string) {
        return this.employeeService.searchEmployeeByTarget(target, value).pipe(map(res => res.data ?? []));
    }

    searchEmpleadoLibre(search: string) {
        return this.employeeService.searchEmployee(search).pipe(map(res => res.data ?? []));
    }

    addBeneficiarioAlim(payload: BeneficiarioAlimRequest) {
        return this.http.post<ApiResponse<IdResponse>>(`${this.base}/beneficiarios/alim`, payload);
    }

    addBeneficario(payload: BeneficiarioRequest) {
        return this.http.post<ApiResponse<any>>(`${this.base}/beneficiarios`, payload);
    }

    getAllBeneficiarios(): Observable<ApiResponse<BeneficiarioDTO[]>> {
        return this.http.get<ApiResponse<BeneficiarioDTO[]>>( `${this.base}/beneficiarios`);
    }

    getBeneficiario(id: number): Observable<ApiResponse<BeneficiarioDetalleResponse[]>> {
        return this.http.get<ApiResponse<BeneficiarioDetalleResponse[]>>(`${this.base}/beneficiarios/${id}`);
    }

    getBeneficiaryByEmployee(empleadoId: number): Observable<ApiResponse<BeneficiarioEmpleadoResponse>> {
        return this.http.get<ApiResponse<BeneficiarioEmpleadoResponse>>(`${this.base}/beneficiarios/empleado/${empleadoId}`);
    }

    getLiquidoByRfc(rfc: string): Observable<ApiResponse<LiquidoResponse>> {
        return this.http.get<ApiResponse<LiquidoResponse>>(`${this.base}/calculation/nomina-cheque/liquido/${rfc}`);
    }

    getHistoricByEmployee(empleadoId: number): Observable<ApiResponse<any>> {
       return this.http.get<ApiResponse<any>>(`${this.base}/beneficiarios/empleado/${empleadoId}/historico`)
    
    }
 
    updateBeneficiario(id: number, payload: BeneficiarioRequest): Observable<ApiResponse<any>> {
        return this.http.patch<ApiResponse<any>>(`${this.base}/beneficiarios/${id}`, payload);
    }

    updateBeneficiarioAlim(id: number, payload: BeneficiarioAlimRequest): Observable<ApiResponse<any>> {
        return this.http.patch<ApiResponse<any>>(`${this.base}/beneficiarios/alim/${id}`,payload);
    }

    deleteBeneficiarioAlim(id: number): Observable<ApiResponse<any>> {
        return this.http.delete<ApiResponse<any>>(`${this.base}/beneficiarios/alim/${id}`);
    }

    deleteBeneficiario(id: number): Observable<ApiResponse<any>> {
        return this.http.delete<ApiResponse<any>>(`${this.base}/beneficiarios/${id}`);
    }

    downloadReport(qnaProceso?: number | null): Observable<HttpResponse<Blob>> {
        let params = new HttpParams();
        if(qnaProceso !=null) {
            params = params.set('qnaProceso', qnaProceso);
        }
        return this.http.get(`${this.base}/beneficiarios/reporte-pagos`, { params, responseType: 'blob', observe: 'response'});
    }
}

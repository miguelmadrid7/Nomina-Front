import { Injectable} from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../models/api-Response.model';
import { Banco } from '../../models/banco.model';
import { BeneficiarioDetalleResponse, BeneficiarioDTO, BeneficiarioRequest } from '../../models/beneficiario.model';
import { IdResponse } from '../../models/id-Response.model';
import { BeneficiarioAlimRequest } from '../../models/pension-Alimenticia-model';
import { Empleado } from '../../features/servicios/empleado';
import { Observable } from 'rxjs';


@Injectable({ providedIn: 'root' })
export class PensionAlimenticiaService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

    private extraHeaders(key?: string, value?: string) {
        return key && value ? { headers: new HttpHeaders().set(key, value) } : {};
    }

    // Busca por RFC/CURP/NOMBRE usando header targetValue
    searchPorTarget(target: 'RFC' | 'CURP' | 'NOMBRE', value: string) {
        return this.http.get<ApiResponse<Empleado[]>>(
            `${this.base}/employee/by/${target}`,
            this.extraHeaders('targetValue', value)
        );
    }

    // Búsqueda libre (una sola caja)
    searchEmpleadoLibre(search: string) {
        return this.http.get<ApiResponse<Empleado[]>>(
        `${this.base}/employee/by/${encodeURIComponent(search)}/search`
        );
    }

    //Se obtiene la lista de los banco que hay en la bd y los muestra el combobox
    getBancos() {
        return this.http.get<ApiResponse<Banco[]>>(`${this.base}/catalogo/bancos`);
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
}

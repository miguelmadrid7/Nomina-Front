import { Injectable} from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../interfaces/api-response-inter';
import { Banco } from '../interfaces/banco-inter';
import { BeneficiarioRequest } from '../interfaces/beneficiario-request-inter';
import { IdResponse } from '../interfaces/id-response-inter';
import { BeneficiarioAlimRequest } from '../interfaces/pension-alimenticia-inter';
import { Empleado } from '../components/servicios/empleado';


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
}

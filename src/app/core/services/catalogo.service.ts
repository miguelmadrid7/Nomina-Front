import { HttpClient } from "@angular/common/http";
import { environment } from "../../../environments/environment";
import { inject, Injectable } from "@angular/core";
import { ApiResponse } from "../model/response/api-Response.model";
import { Banco } from "../model/banco.model";

@Injectable({ providedIn: 'root' })
export class CatalogoService {

    private base = environment.apiUrl;
    private readonly http = inject (HttpClient);

     getBancos() {
        return this.http.get<ApiResponse<Banco[]>>(`${this.base}/catalogo/bancos`);
    }


}
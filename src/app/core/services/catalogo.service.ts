import { HttpClient } from "@angular/common/http";
import { environment } from "../../../environments/environment";
import { Injectable } from "@angular/core";
import { ApiResponse } from "../model/response/api-Response.model";
import { Banco } from "../model/banco.model";

@Injectable({ providedIn: 'root' })
export class CatalogoService {

    private base = environment.apiUrl;
    constructor(private http: HttpClient) {}

     getBancos() {
        return this.http.get<ApiResponse<Banco[]>>(`${this.base}/catalogo/bancos`);
    }


}
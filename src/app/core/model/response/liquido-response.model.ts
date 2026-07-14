import { PlazaLiquido } from "../../../models/plaza-liquido.model";

export interface LiquidoResponse {
     rfc: string;
    nombreCompleto: string;
    plazas: PlazaLiquido[];
}


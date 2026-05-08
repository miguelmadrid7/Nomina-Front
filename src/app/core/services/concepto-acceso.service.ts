import { Injectable } from '@angular/core';
import { LoginService } from './login.service';

@Injectable({ providedIn: 'root' })
export class ConceptoAccesoService {
  constructor(private loginService: LoginService) {}

  getConceptosPermitidosRegistroTerceros(): string[] | null {
    const roles = this.loginService.getRoles();
    if (roles.includes(1)) return null;

    const permitidos: string[] = [];
    if (roles.includes(3)) permitidos.push('NP');
    if (roles.includes(7)) permitidos.push('5L');
    if (roles.includes(8)) permitidos.push('6L');

    return permitidos.length > 0 ? Array.from(new Set(permitidos)) : null;
  }
}

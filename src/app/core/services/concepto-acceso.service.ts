import { Injectable } from '@angular/core';
import { LoginService } from './login.service';

@Injectable({ providedIn: 'root' })
export class ConceptoAccesoService {
  constructor(private loginService: LoginService) {}

  getConceptosPermitidosRegistroTerceros(): string[] | null {
    const roles = this.loginService.getRoles();
    if (roles.includes(1)) return null;
    if (roles.includes(3)) return ['NP'];
    if (roles.includes(7)) return ['5L'];
    return null;
  }
}

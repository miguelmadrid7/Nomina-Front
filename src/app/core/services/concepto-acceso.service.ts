import { Injectable } from '@angular/core';
import { LoginService } from './login.service';

@Injectable({ providedIn: 'root' })
export class ConceptoAccesoService {
  constructor(private loginService: LoginService) {}

  getConceptosPermitidosRegistroTerceros(): string[] | null {
    const roles = this.loginService.getRoles();
    if (roles.includes(1)) return null;

    const permitidos: string[] = [];
      /* INSTITUCIONAL */
      if (roles.includes(7)) permitidos.push('03');
      if (roles.includes(7)) permitidos.push('08');
      if (roles.includes(7)) permitidos.push('12');
      if (roles.includes(7)) permitidos.push('55');
      if (roles.includes(7)) permitidos.push('56');
      if (roles.includes(7)) permitidos.push('64');
      if (roles.includes(7)) permitidos.push('VT');
      if (roles.includes(7)) permitidos.push('SF');
      if (roles.includes(7)) permitidos.push('5L');
      if (roles.includes(7)) permitidos.push('6L');
      if (roles.includes(8)) permitidos.push('21');


      /* NO INSTITUCIONAL */
      if (roles.includes(8)) permitidos.push('VP');
      if (roles.includes(55)) permitidos.push('53');
    if (roles.includes(56)) permitidos.push('61');
    if (roles.includes(57)) permitidos.push('CS');
    if (roles.includes(58)) permitidos.push('CE');
    if (roles.includes(59)) permitidos.push('FJ');
    if (roles.includes(60)) permitidos.push('GF');
    if (roles.includes(61)) permitidos.push('51');
    if (roles.includes(62)) permitidos.push('57');
    if (roles.includes(63)) permitidos.push('IA');
    if (roles.includes(64)) permitidos.push('IC');
    if (roles.includes(65)) permitidos.push('IM');
    if (roles.includes(66)) permitidos.push('IV');
    if (roles.includes(67)) permitidos.push('NP');
    if (roles.includes(68)) permitidos.push('SG');
    if (roles.includes(69)) permitidos.push('BS');
    if (roles.includes(70)) permitidos.push('BR');
    if (roles.includes(71)) permitidos.push('EF');
    if (roles.includes(72)) permitidos.push('KO');
    if (roles.includes(73)) permitidos.push('LB');
    if (roles.includes(74)) permitidos.push('OH');
    if (roles.includes(75)) permitidos.push('SU');
    if (roles.includes(76)) permitidos.push('TC');
    if (roles.includes(77)) permitidos.push('TM');
    if (roles.includes(78)) permitidos.push('TN');

    return permitidos.length > 0 ? Array.from(new Set(permitidos)) : null;
  }
}

import { BeneficiarioJMRequest } from '../../models/request/beneficiariojm-request.model';

    export function mapBeneficiarioJM(raw: any): BeneficiarioJMRequest {
        return {
            ...raw,
            rfc: raw?.rfc ?? '',
            primerApellido:  raw?.primerApellido ?? '',
            segundoApellido: raw?.segundoApellido ?? '',
            nombre: raw?.nombre ?? '',
        };
    }

    export function formatBeneficiarioJMDisplay(emp: BeneficiarioJMRequest | string | null): string {
        if (!emp) return '';
        if (typeof emp === 'string') return emp;
        const isCode = (s?: string) => !!s && /^[A-Z0-9]{13,18}$/.test(s.trim());
        const fullName = [emp.primerApellido, emp.segundoApellido, emp.nombre]
            .filter(x => x && !isCode(x))
            .join(' ')
            .replace(/\s{2,}/g, ' ')
            .trim();
        return [emp.rfc || '', fullName || ''].filter(Boolean).join(' - ');
    }

    export function  limpiarNombreCompleto(s?: string): string {
        const raw = (s ?? '').toString().replace(/\s{2,}/g, ' ').trim();
        if (!raw) return '';
        const lastSeg = raw.split('-').map(x => x.trim()).filter(Boolean).pop() ?? raw;
        const sinCodigosInicio = lastSeg.replace(/^(?:[A-Z0-9]{13,18}\s*)+/, '').trim();
        return sinCodigosInicio.replace(/\s{2,}/g, ' ').trim();
    }

    export function  repartirNombre(emp: BeneficiarioJMRequest): { primerApellido: string; segundoApellido: string; nombre: string } {
        const limpia = (x?: string) => (x ?? '').toString().trim().replace(/\s{2,}/g, ' ');
        let pa = limpia(emp.primerApellido);
        let sa = limpia(emp.segundoApellido);
        let no = limpia(emp.nombre);

        no = limpiarNombreCompleto(no);
        if (pa && sa && no) return { primerApellido: pa, segundoApellido: sa, nombre: no };
        const tokens = no.split(/\s+/).filter(Boolean);

        if ((!pa || !sa) && tokens.length >= 3) {
        if (!pa) pa = tokens[0];
        if (!sa) sa = tokens[1];
        no = tokens.slice(2).join(' ');
        } else if ((!pa || !no) && tokens.length === 2) {
        if (!pa) pa = tokens[0];
        no = tokens[1];
        }
        return { primerApellido: limpia(pa), segundoApellido: limpia(sa), nombre: limpia(no) };
    }

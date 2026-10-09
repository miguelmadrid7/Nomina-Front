import { EmpleadoItem } from '../../core/model/emplado.model';

    export function mapEmpleado(raw: any): EmpleadoItem {
        let rfc  = (raw?.rfc  ?? raw?.RFC  ?? '').toString().trim();
        let curp = (raw?.curp ?? raw?.CURP ?? '').toString().trim();
        const concatenated = (raw?.empleado ?? '').toString().trim();
        if ((!rfc || !curp) && concatenated.includes('-')) {
            const parts = concatenated.split('-').map((p: string) => p.trim());
            if (parts.length >= 3) {
            rfc  = rfc  || parts[0];
            curp = curp || parts[1];
            }
        }
        const paternalSurname = (raw?.primer_apellido  ?? raw?.primerApellido  ?? '').toString().trim();
        const maternalSurname = (raw?.segundo_apellido ?? raw?.segundoApellido ?? '').toString().trim();
        const firstName       = (raw?.nombre ?? '').toString().trim();
        const fullName = (
            [paternalSurname, maternalSurname, firstName].filter(Boolean).join(' ') ||
            (concatenated.includes('-')
            ? concatenated.split('-').slice(2).join('-').trim()
            : concatenated)
        ).replace(/\s+/g, ' ').trim();
        return { ...raw, rfc, curp, nombreCompleto: fullName } as EmpleadoItem;
    }

    export function formatEmployeeDisplay(emp: EmpleadoItem | string | null): string {
        if (!emp) return '';
        if (typeof emp === 'string') return emp;
        const rfc    = (emp.rfc  ?? emp.RFC  ?? '').toString().trim() || '—';
        const curp   = (emp.curp ?? emp.CURP ?? '').toString().trim() || '—';
        const nombre = (emp.nombreCompleto ?? '').toString().trim()   || '—';
        return `${rfc} · ${curp} · ${nombre}`;
    }
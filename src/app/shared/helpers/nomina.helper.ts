import { NominaRow } from "../../models/nomina-Row.model";

    export function parsePeriodoToQna(periodo: any): number | null {
    const per = String(periodo ?? '');
    const match = per.match(/^(\d{1,2})\/(\d{4})$/);
    if (!match) return null;
    const q = match[1].padStart(2, '0');
    const y = match[2];
    return parseInt(`${y}${q}`, 10);
    }

    export function mapRawRowToNominaRow(row: any[]): NominaRow {
        return {
            noComprobante: row[0],
            ur: row[1],
            periodo: row[2],
            qnaProceso: parsePeriodoToQna(row[2]),
            tipoNomina: row[3],
            clavePlaza: row[4],
            curp: row[5],
            rfc: row[6],
            nombreEmpleado:`${row[7]} ${row[8]} ${row[9]}`,
            tipoConcepto: row[10],
            concepto: row[11],
            descConcepto: row[12],
            importe: Number(row[13]) || 0,
            baseCalculoIsr:Number(row[14]) || 0,
        };
    }

    export function groupNominaRows(rows: NominaRow[]): NominaRow[] {
        const groupedMap = rows.reduce((map, row) => {
        const key = `${row.rfc}|${row.curp}|${row.qnaProceso}|${row.noComprobante}`;
            if (!map.has(key)) {
                map.set(key, { ...row, detalles: [] as NominaRow['detalles'] });
            }
            map.get(key)!.detalles!.push({
                noComprobante: row.noComprobante,
                tipoConcepto: row.tipoConcepto,
                concepto: row.concepto,
                importe: row.importe,
            });
            return map;
        }, new Map<string, NominaRow>());
        return Array.from(groupedMap.values());
    }

    export function buildQnaCode(anio: number, quincena: number): number {
        return parseInt(`${anio}${quincena.toString().padStart(2, '0')}`, 10);
    }
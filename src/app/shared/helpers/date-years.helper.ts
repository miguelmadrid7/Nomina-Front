export class DateYearsHelper {
    
    /**
     * Genera una lista de años alrededor del año actual, de mayor a menor.
     * Se usa para llenar selectores de año.
     * Ej. (año actual 2026): getYears(1, 1) → [2027, 2026, 2025]
     * @param futureYears Años hacia adelante a incluir (default 1).
     * @param pastYears   Años hacia atrás a incluir (default 1).
     */
    static getYears( futureYears: number = 1, pastYears: number = 1): number[] {
        const actual = new Date().getFullYear();
        return Array.from(
            { length: futureYears + pastYears + 1 },
            (_, i) => actual + pastYears - i
        );
    }

    /**
     * Regresa los números de quincena del año, del 1 al 24.
     * Se usa para llenar selectores de quincena.
     * Ej.: getQna() → [1, 2, 3, ..., 24]
     */
    static getQna (): number[] {
        return Array.from(
            { length: 24 }, 
            (_, i) => i + 1
        );
    }

    /**
     * Convierte una duración en milisegundos a un texto legible.
     * Ej.: formatDuration(850) → '850 ms' | formatDuration(4500) → '4.50 s' | formatDuration(95000) → '1 min 35.0 s'
     * @param ms Duración en milisegundos.
     */
    static formatDuration(ms: number): string {
        if (ms < 1000) {
            return `${ms} ms`;
        }
        if (ms < 60000) {
            return `${(ms / 1000).toFixed(2)} s`;
        }
        const minutes = Math.floor(ms / 60000);
        const seconds = ((ms % 60000) / 1000).toFixed(1);
        return `${minutes} min ${seconds} s`;
    }

    /**
     * Convierte una fecha local a 'yyyy-MM-dd' sin desfase por zona horaria.
     * Usar en lugar de toISOString(), que convierte a UTC y puede recorrer un día.
     * Ej.: toIsoDate(new Date(2026, 10, 10)) → '2026-11-10'
     * @param date Fecha a convertir.
    */
    static toIsoDate(date: Date): string {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    /**
     * Convierte año y quincena al código de quincena yyyyQQ.
     * Ej.: toQnaCode(2025, 22) → 202522 | toQnaCode(2026, 1) → 202601
     * @param year Año de 4 dígitos.
     * @param qna  Número de quincena (1 a 24).
    */
    static toQnaCode(year: number, qna: number): number {
        return year * 100 + qna;
    }
}
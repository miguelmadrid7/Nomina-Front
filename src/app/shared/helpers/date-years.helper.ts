export class DateYearsHelper {
    
    static getYears( futureYears: number = 1, pastYears: number = 1): number[] {
        const actual = new Date().getFullYear();
        return Array.from(
            { length: futureYears + pastYears + 1 },
            (_, i) => actual + pastYears - i
        );
    }

    static getQna (): number[] {
        return Array.from(
            { length: 24 }, 
            (_, i) => i + 1
        );
    }

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
}
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
}